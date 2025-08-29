"""
Document Generation API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, List

from app.services.ai_service import ai_service
from app.core.logging import get_logger
from app.models.cv_models import DocumentGenerationRequest, DocumentGenerationResponse, GeneratedDocument

logger = get_logger(__name__)

router = APIRouter()


@router.post("/generate-documents", response_model=DocumentGenerationResponse)
async def generate_documents(request: DocumentGenerationRequest):
    """
    Generate tailored documents (CV, cover letter) using AI
    
    Args:
        request: Document generation request with profile and job data
        
    Returns:
        Generated documents
    """
    try:
        logger.info("Document generation request received", extra={
            "document_types": request.document_types,
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
        documents = []
        
        # Generate requested document types
        for doc_type in request.document_types:
            if doc_type.lower() == "cv":
                content = await ai_service.generate_cv(
                    request.profile_data.dict(),
                    request.job_data.dict()
                )
                documents.append(GeneratedDocument(
                    type="cv",
                    content=content,
                    filename="tailored-cv.txt"
                ))
                
            elif doc_type.lower() in ["cover_letter", "coverletter"]:
                content = await ai_service.generate_cover_letter(
                    request.profile_data.dict(),
                    request.job_data.dict()
                )
                documents.append(GeneratedDocument(
                    type="cover_letter",
                    content=content,
                    filename="cover-letter.txt"
                ))
        
        logger.info("Document generation completed successfully", extra={
            "documents_generated": len(documents)
        })
        
        return DocumentGenerationResponse(
            success=True,
            documents=documents
        )
        
    except Exception as e:
        logger.error(f"Document generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Document generation failed: {str(e)}"
        )


@router.post("/generate-cv")
async def generate_cv(request: DocumentGenerationRequest):
    """
    Generate tailored CV only
    
    Args:
        request: Document generation request
        
    Returns:
        Generated CV
    """
    try:
        logger.info("CV generation request received", extra={
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
        content = await ai_service.generate_cv(
            request.profile_data.dict(),
            request.job_data.dict()
        )
        
        logger.info("CV generation completed successfully")
        
        return JSONResponse(content={
            "success": True,
            "cv": {
                "content": content,
                "filename": "tailored-cv.txt"
            }
        })
        
    except Exception as e:
        logger.error(f"CV generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"CV generation failed: {str(e)}"
        )


@router.post("/generate-cover-letter")
async def generate_cover_letter(request: DocumentGenerationRequest):
    """
    Generate tailored cover letter only
    
    Args:
        request: Document generation request
        
    Returns:
        Generated cover letter
    """
    try:
        logger.info("Cover letter generation request received", extra={
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
        content = await ai_service.generate_cover_letter(
            request.profile_data.dict(),
            request.job_data.dict()
        )
        
        logger.info("Cover letter generation completed successfully")
        
        return JSONResponse(content={
            "success": True,
            "cover_letter": {
                "content": content,
                "filename": "cover-letter.txt"
            }
        })
        
    except Exception as e:
        logger.error(f"Cover letter generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Cover letter generation failed: {str(e)}"
        )
