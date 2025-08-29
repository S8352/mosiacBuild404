"""
CV Parsing API routes
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from typing import Dict, Any
import base64
import logging

from app.services.cv_parsing_service import cv_parsing_service
from app.core.logging import get_logger
from app.core.database import get_db
from app.models.cv_models import CVParsingRequest, CVParsingResponse

logger = get_logger(__name__)

router = APIRouter()


@router.post("/parse-cv", response_model=CVParsingResponse)
async def parse_cv(request: CVParsingRequest):
    """
    Parse CV file and extract structured data
    
    Args:
        request: CV parsing request with file data and type
        
    Returns:
        Parsed CV data and feedback
    """
    try:
        logger.info("CV parsing request received", extra={
            "file_type": request.file_type,
            "file_size": len(request.file_data)
        })
        
        # Validate file type
        if request.file_type.lower() not in ["pdf", "docx", "doc"]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Supported types: pdf, docx, doc"
            )
        
        # Parse CV
        result = await cv_parsing_service.parse_cv(
            request.file_data,
            request.file_type
        )
        
        logger.info("CV parsing completed successfully")
        
        return CVParsingResponse(
            success=True,
            profile_data=result["profileData"],
            feedback=result["feedback"]
        )
        
    except Exception as e:
        logger.error(f"CV parsing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"CV parsing failed: {str(e)}"
        )


@router.post("/parse-cv-file")
async def parse_cv_file(file: UploadFile = File(...)):
    """
    Parse CV file uploaded via multipart form
    
    Args:
        file: Uploaded CV file
        
    Returns:
        Parsed CV data and feedback
    """
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        file_extension = file.filename.split('.')[-1].lower()
        if file_extension not in ["pdf", "docx", "doc"]:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Supported types: pdf, docx, doc"
            )
        
        # Read file content
        content = await file.read()
        file_data = base64.b64encode(content).decode('utf-8')
        
        logger.info("CV file parsing request received", extra={
            "filename": file.filename,
            "file_size": len(content)
        })
        
        # Parse CV
        result = await cv_parsing_service.parse_cv(file_data, file_extension)
        
        logger.info("CV file parsing completed successfully")
        
        return JSONResponse(content={
            "success": True,
            "profile_data": result["profileData"],
            "feedback": result["feedback"]
        })
        
    except Exception as e:
        logger.error(f"CV file parsing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"CV file parsing failed: {str(e)}"
        )
