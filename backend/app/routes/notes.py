import os
import uuid
import logging
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, BackgroundTasks, Response
from fastapi.responses import FileResponse
from bson import ObjectId
from app.db.mongodb import get_db, log_activity
from app.routes.auth import get_current_user
from app.core.rag import index_note, delete_note_embeddings
from app.core.storage import storage_backend


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes Management"])

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB in bytes

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def bg_index_note(user_id: str, note_id: str, filename: str, subject: str, filepath: str):
    """Background task to extract, chunk, embed, and index a PDF note."""
    db = get_db()
    try:
        # Since index_note is CPU/IO-bound and synchronous, run it in a separate thread
        await asyncio.to_thread(
            index_note,
            user_id=user_id,
            note_id=note_id,
            filename=filename,
            subject=subject,
            filepath=filepath
        )
        # Log user study activity on success
        await log_activity(db, user_id, "upload_note")
    except Exception as e:
        logger.error(f"Background indexing failed for note {note_id}: {e}")
        # Rollback metadata from MongoDB
        try:
            await db["notes"].delete_one({"_id": ObjectId(note_id)})
        except Exception as db_err:
            logger.error(f"Failed to rollback note metadata for {note_id}: {db_err}")
        # Rollback local file from storage
        try:
            storage_backend.delete_file(filepath)
        except Exception as file_err:
            logger.error(f"Failed to rollback note file {filepath}: {file_err}")

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_note(
    title: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Upload a study note (PDF), store its metadata, and queue background indexing."""
    # 1. Validation: Check if it's a PDF extension
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )
        
    # 2. Validation: Check file size dynamically
    # Read content to check size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size limit of 20MB. Uploaded: {file_size / (1024 * 1024):.2f}MB"
        )
        
    # Reset read pointer in case we need it later
    await file.seek(0)

    # 3. Validate MIME type using python-magic with a robust fallback to magic bytes
    is_pdf = False
    try:
        import magic
        mime_type = magic.from_buffer(contents[:2048], mime=True)
        if mime_type == "application/pdf":
            is_pdf = True
    except Exception as e:
        logger.warning(f"Could not perform MIME type verification using python-magic: {e}")
        # Fallback: Check magic bytes signature directly
        if contents.startswith(b"%PDF-"):
            is_pdf = True

    if not is_pdf:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file content. Only PDF files are allowed."
        )

    # 4. Sanitize original filename (Path Traversal Protection)
    orig_filename = os.path.basename(file.filename)
    name_part, ext_part = os.path.splitext(orig_filename)
    # Strip non-alphanumeric characters from name_part
    sanitized_name = "".join(c for c in name_part if c.isalnum())
    if not sanitized_name:
        sanitized_name = "uploaded_note"
    safe_filename = f"{sanitized_name}.pdf"
    
    # 5. Create unique filepath
    unique_filename = f"{uuid.uuid4()}_{safe_filename}"
    
    # 6. Save file using storage_backend abstraction
    try:
        filepath = storage_backend.save_file(contents, unique_filename)
    except Exception as e:
        logger.error(f"Failed to write file to storage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file locally on server"
        )
        
    # 7. Save metadata in MongoDB
    note_doc = {
        "user_id": ObjectId(current_user["_id"]),
        "title": title,
        "subject": subject,
        "filename": safe_filename,
        "filepath": filepath,
        "filesize": file_size,
        "upload_date": datetime.now(timezone.utc)
    }
    
    try:
        result = await db["notes"].insert_one(note_doc)
        inserted_id = str(result.inserted_id)
    except Exception as e:
        logger.error(f"Failed to save metadata in database: {e}")
        # Clean up file in storage if DB insert fails
        try:
            storage_backend.delete_file(filepath)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save note metadata in database"
        )
        
    # 8. Index PDF chunks in ChromaDB for search in the background to avoid blocking the event loop
    background_tasks.add_task(
        bg_index_note,
        user_id=current_user["_id"],
        note_id=inserted_id,
        filename=safe_filename,
        subject=subject,
        filepath=filepath
    )
        
    return {
        "id": inserted_id,
        "user_id": current_user["_id"],
        "title": title,
        "subject": subject,
        "filename": safe_filename,
        "filesize": file_size,
        "upload_date": note_doc["upload_date"].isoformat(),
        "status": "indexing"
    }


@router.get("")
async def get_notes(
    q: str | None = None,
    subject: str | None = None,
    page: int | None = None,
    limit: int | None = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
    response: Response = None
):
    """Retrieve all notes for the authenticated user, supporting optional search, subject filtering, and pagination."""
    query = {"user_id": ObjectId(current_user["_id"])}
    
    # Apply subject filter
    if subject and subject != "All":
        query["subject"] = subject
        
    # Apply search text filter (case-insensitive title matches)
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
        
    try:
        total_count = await db["notes"].count_documents(query)
        
        cursor = db["notes"].find(query).sort("upload_date", -1)
        if page is not None and limit is not None:
            skip = (page - 1) * limit
            cursor = cursor.skip(skip).limit(limit)
            notes_list = await cursor.to_list(length=limit)
        else:
            notes_list = await cursor.to_list(length=100)
            
        if response and page is not None and limit is not None:
            response.headers["X-Total-Count"] = str(total_count)
            response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
        
        # Format response objects
        response_data = []
        for note in notes_list:
            response_data.append({
                "id": str(note["_id"]),
                "user_id": str(note["user_id"]),
                "title": note["title"],
                "subject": note["subject"],
                "filename": note["filename"],
                "filesize": note["filesize"],
                "upload_date": note["upload_date"].isoformat()
            })
        return response_data
    except Exception as e:
        logger.error(f"Failed to fetch notes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notes list from server"
        )

@router.delete("/{id}")
async def delete_note(
    id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Delete a note's metadata from MongoDB, purge from ChromaDB, and remove from storage."""
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
        
    # Find the note first
    note = await db["notes"].find_one({"_id": ObjectId(id)})
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
        
    # Check authorization (ownership)
    if str(note["user_id"]) != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this note"
        )
        
    # Delete metadata from database
    try:
        await db["notes"].delete_one({"_id": ObjectId(id)})
    except Exception as e:
        logger.error(f"Failed to delete database metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete note metadata from database"
        )
        
    # Delete matching vectors from ChromaDB (using user partitioned collection)
    try:
        delete_note_embeddings(current_user["_id"], id)
    except Exception as e:
        logger.error(f"Failed to delete matching vectors for note {id}: {e}")
        
    # Delete physical file using storage_backend
    filepath = note["filepath"]
    try:
        storage_backend.delete_file(filepath)
    except Exception as e:
        logger.error(f"Failed to delete physical file {filepath}: {e}")
            
    return {"message": "Note deleted successfully", "id": id}
            # We don't raise an exception here because the database record is already gone,
            # but we log it for admin investigation of orphan files.
            
    return {"message": "Note deleted successfully", "id": id}


@router.get("/{id}/download")
async def download_note(
    id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Securely download or view the PDF file by verifying ownership first."""
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid note ID format"
        )
        
    note = await db["notes"].find_one({"_id": ObjectId(id)})
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
        
    # Check authorization (ownership)
    if str(note["user_id"]) != current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this note"
        )
        
    filepath = note["filepath"]
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Physical file not found on disk"
        )
        
    return FileResponse(
        path=filepath,
        filename=note["filename"],
        media_type="application/pdf"
    )
