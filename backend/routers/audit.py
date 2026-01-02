from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from services.audit_core import perform_audit
import shutil
import os
import uuid

router = APIRouter()

TEMP_DIR = "temp_audit_files"
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_project(
    previous_image: UploadFile = File(...),
    current_image: UploadFile = File(...),
    project_id: str = Form(...)
):
    try:
        # Save uploaded files temporarily
        prev_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{previous_image.filename}")
        curr_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{current_image.filename}")
        
        with open(prev_path, "wb") as buffer:
            shutil.copyfileobj(previous_image.file, buffer)
            
        with open(curr_path, "wb") as buffer:
            shutil.copyfileobj(current_image.file, buffer)
            
        # Perform analysis
        result = perform_audit(prev_path, curr_path, project_id)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/report/{filename}")
async def get_report(filename: str):
    file_path = os.path.join(TEMP_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path, 
            media_type="application/pdf", 
            filename=filename,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    raise HTTPException(status_code=404, detail="Report not found")
