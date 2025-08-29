"""
Job Analysis API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any

from app.services.ai_service import ai_service
from app.core.logging import get_logger
from app.models.cv_models import JobFitAnalysisRequest, JobFitAnalysisResponse, JobFitAnalysis

logger = get_logger(__name__)

router = APIRouter()


@router.post("/analyze-job-fit", response_model=JobFitAnalysisResponse)
async def analyze_job_fit(request: JobFitAnalysisRequest):
    """
    Analyze job fit between candidate profile and job posting
    
    Args:
        request: Job fit analysis request with profile and job data
        
    Returns:
        Job fit analysis results
    """
    try:
        logger.info("Job fit analysis request received", extra={
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
        # Perform job fit analysis using AI
        analysis_result = await ai_service.analyze_job_fit(
            request.profile_data.dict(),
            request.job_data.dict()
        )
        
        # Create structured response
        job_fit_analysis = JobFitAnalysis(
            fit_score=analysis_result.get("fit_score", 70),
            match_level=analysis_result.get("match_level", "Medium"),
            strengths=analysis_result.get("strengths", []),
            areas_for_improvement=analysis_result.get("areas_for_improvement", []),
            recommendations=analysis_result.get("recommendations", []),
            analysis=analysis_result.get("analysis", "")
        )
        
        logger.info("Job fit analysis completed successfully", extra={
            "fit_score": job_fit_analysis.fit_score,
            "match_level": job_fit_analysis.match_level
        })
        
        return JobFitAnalysisResponse(
            success=True,
            analysis=job_fit_analysis
        )
        
    except Exception as e:
        logger.error(f"Job fit analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Job fit analysis failed: {str(e)}"
        )


@router.post("/analyze-job-requirements")
async def analyze_job_requirements(request: JobFitAnalysisRequest):
    """
    Analyze job requirements and provide insights
    
    Args:
        request: Job analysis request
        
    Returns:
        Job requirements analysis
    """
    try:
        logger.info("Job requirements analysis request received", extra={
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
        # Analyze job requirements using AI
        prompt = f"""
        Analyze this job posting and provide insights:
        
        Job Title: {request.job_data.title}
        Company: {request.job_data.company}
        Description: {request.job_data.description}
        Requirements: {request.job_data.requirements}
        
        Provide analysis with:
        1. Key requirements and skills needed
        2. Experience level required
        3. Industry insights
        4. Salary expectations
        5. Application tips
        """
        
        analysis = await ai_service.generate_text(prompt)
        
        logger.info("Job requirements analysis completed successfully")
        
        return JSONResponse(content={
            "success": True,
            "analysis": analysis,
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
    except Exception as e:
        logger.error(f"Job requirements analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Job requirements analysis failed: {str(e)}"
        )


@router.post("/suggest-improvements")
async def suggest_improvements(request: JobFitAnalysisRequest):
    """
    Suggest improvements for candidate profile based on job requirements
    
    Args:
        request: Job analysis request
        
    Returns:
        Improvement suggestions
    """
    try:
        logger.info("Improvement suggestions request received", extra={
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
        # Generate improvement suggestions using AI
        prompt = f"""
        Based on this job posting, suggest improvements for the candidate's profile:
        
        Job Title: {request.job_data.title}
        Company: {request.job_data.company}
        Description: {request.job_data.description}
        Requirements: {request.job_data.requirements}
        
        Candidate Profile: {request.profile_data.dict()}
        
        Provide specific suggestions for:
        1. Skills to develop or highlight
        2. Experience gaps to address
        3. CV improvements
        4. Interview preparation
        5. Networking opportunities
        """
        
        suggestions = await ai_service.generate_text(prompt)
        
        logger.info("Improvement suggestions completed successfully")
        
        return JSONResponse(content={
            "success": True,
            "suggestions": suggestions,
            "job_title": request.job_data.title,
            "company": request.job_data.company
        })
        
    except Exception as e:
        logger.error(f"Improvement suggestions failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Improvement suggestions failed: {str(e)}"
        )
