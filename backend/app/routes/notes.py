import os
import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from bson import ObjectId
from app.db.mongodb import get_db, log_activity
from app.routes.auth import get_current_user
from app.core.rag import index_note, delete_note_embeddings


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/notes", tags=["Notes Management"])

UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB in bytes

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_note(
    title: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Upload a study note (PDF) and store its metadata in MongoDB."""
    # 1. Validation: Check if it's a PDF
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
        
    # Reset read pointer in case we need it later (not strictly needed since we have contents, but good practice)
    await file.seek(0)
    
    # 3. Create unique filepath
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, unique_filename)
    
    # 4. Save file to local disk
    try:
        with open(filepath, "wb") as f:
            f.write(contents)
    except Exception as e:
        logger.error(f"Failed to write file to disk: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save file locally on server"
        )
        
    # 5. Save metadata in MongoDB
    note_doc = {
        "user_id": ObjectId(current_user["_id"]),
        "title": title,
        "subject": subject,
        "filename": file.filename,
        "filepath": filepath,
        "filesize": file_size,
        "upload_date": datetime.now(timezone.utc)
    }
    
    try:
        result = await db["notes"].insert_one(note_doc)
        inserted_id = str(result.inserted_id)
    except Exception as e:
        logger.error(f"Failed to save metadata in database: {e}")
        # Clean up file on disk if DB insert fails
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save note metadata in database"
        )
        
    # 6. Index PDF chunks in ChromaDB for search
    try:
        index_note(
            user_id=current_user["_id"],
            note_id=inserted_id,
            filename=file.filename,
            subject=subject,
            filepath=filepath
        )
    except Exception as e:
        logger.error(f"Failed to index note {inserted_id} in ChromaDB: {e}")
        # Rollback: Clean up database entry
        await db["notes"].delete_one({"_id": ObjectId(inserted_id)})
        # Rollback: Clean up local file
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process and index PDF: {str(e)}"
        )
        
    # Log user activity
    await log_activity(db, current_user["_id"], "upload_note")
        
    return {
        "id": inserted_id,
        "user_id": current_user["_id"],
        "title": title,
        "subject": subject,
        "filename": file.filename,
        "filesize": file_size,
        "upload_date": note_doc["upload_date"].isoformat()
    }


@router.get("")
async def get_notes(
    q: str | None = None,
    subject: str | None = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db)
):
    """Retrieve all notes for the authenticated user, supporting optional search and subject filtering."""
    query = {"user_id": ObjectId(current_user["_id"])}
    
    # Apply subject filter
    if subject and subject != "All":
        query["subject"] = subject
        
    # Apply search text filter (case-insensitive title matches)
    if q:
        query["title"] = {"$regex": q, "$options": "i"}
        
    try:
        cursor = db["notes"].find(query).sort("upload_date", -1)
        notes_list = await cursor.to_list(length=100)
        
        # Format response objects
        response = []
        for note in notes_list:
            response.append({
                "id": str(note["_id"]),
                "user_id": str(note["user_id"]),
                "title": note["title"],
                "subject": note["subject"],
                "filename": note["filename"],
                "filesize": note["filesize"],
                "upload_date": note["upload_date"].isoformat()
            })
        return response
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
    """Delete a note's metadata from MongoDB and remove the physical file from disk."""
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
        
    # Delete matching vectors from ChromaDB
    try:
        delete_note_embeddings(id)
    except Exception as e:
        logger.error(f"Failed to delete matching vectors for note {id}: {e}")
        
    # Delete physical file from disk
    filepath = note["filepath"]
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            logger.error(f"Failed to delete physical file {filepath}: {e}")
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
