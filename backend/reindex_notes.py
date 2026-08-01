"""Re-index existing notes into MongoDB.

Note vectors used to live in a local ChromaDB folder. They now live in MongoDB so the
backend can run without a persistent disk. Notes uploaded before that change have no
chunks in MongoDB, so they silently return nothing from search until re-indexed.

Run once, from the backend directory, with the same .env the app uses:

    python reindex_notes.py

Notes whose PDF is missing from disk are reported and left alone; re-upload those.
"""
import asyncio
import logging
import os

from app.core.rag import index_note, CHUNK_COLLECTION
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_db

logging.basicConfig(level=logging.WARNING)


async def main():
    await connect_to_mongo()
    db = get_db()
    try:
        notes = await db["notes"].find({}).to_list(length=1000)
        if not notes:
            print("No notes found.")
            return

        print(f"Found {len(notes)} note(s).\n")
        done = skipped = failed = 0

        for note in notes:
            note_id = str(note["_id"])
            title = note.get("title", "(untitled)")
            filepath = note.get("filepath", "")

            existing = await db[CHUNK_COLLECTION].count_documents({"note_id": note["_id"]})
            if existing:
                print(f"  skip    {title} — already has {existing} chunks")
                skipped += 1
                continue

            if not filepath or not os.path.exists(filepath):
                print(f"  MISSING {title} — PDF not on disk ({filepath or 'no path'}); re-upload it")
                await db["notes"].update_one(
                    {"_id": note["_id"]},
                    {"$set": {"status": "failed", "status_detail": "Original PDF missing; please re-upload."}},
                )
                failed += 1
                continue

            try:
                await index_note(
                    db,
                    user_id=str(note["user_id"]),
                    note_id=note_id,
                    filename=note.get("filename", "note.pdf"),
                    subject=note.get("subject", "Other"),
                    filepath=filepath,
                )
                await db["notes"].update_one(
                    {"_id": note["_id"]},
                    {"$set": {"status": "ready", "status_detail": None}},
                )
                count = await db[CHUNK_COLLECTION].count_documents({"note_id": note["_id"]})
                print(f"  ok      {title} — {count} chunks")
                done += 1
            except Exception as e:
                print(f"  FAILED  {title} — {e}")
                await db["notes"].update_one(
                    {"_id": note["_id"]},
                    {"$set": {"status": "failed", "status_detail": str(e)[:300]}},
                )
                failed += 1

        print(f"\nre-indexed {done}, skipped {skipped}, failed {failed}")
    finally:
        await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
