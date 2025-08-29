"""
CV-related Pydantic models
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class CVParsingRequest(BaseModel):
    """Request model for CV parsing"""
    file_data: str = Field(..., description="Base64 encoded file data")
    file_type: str = Field(..., description="File type (pdf, docx, doc)")


class CVProfileData(BaseModel):
    """Structured CV profile data"""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    work_experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    skills: Dict[str, List[str]] = {"technical": [], "soft": []}
    certifications: List[str] = []
    projects: List[Dict[str, Any]] = []
    languages: List[str] = []
    achievements: List[str] = []


class CVFeedback(BaseModel):
    """CV analysis feedback"""
    score: int = Field(..., ge=0, le=100)
    summary: Dict[str, Any]
    extracted_fields: Dict[str, Any]
    missing_fields: List[str]
    suggestions: List[str]
    confidence: float = Field(..., ge=0, le=1)
    statistics: Dict[str, Any]


class CVParsingResponse(BaseModel):
    """Response model for CV parsing"""
    success: bool
    profile_data: CVProfileData
    feedback: CVFeedback
    error: Optional[str] = None


class JobData(BaseModel):
    """Job posting data"""
    title: str
    company: str
    description: str
    requirements: List[str] = []
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None


class DocumentGenerationRequest(BaseModel):
    """Request model for document generation"""
    profile_data: CVProfileData
    job_data: JobData
    document_types: List[str] = Field(..., description="Types of documents to generate")


class GeneratedDocument(BaseModel):
    """Generated document model"""
    type: str
    content: str
    filename: str
    url: Optional[str] = None


class DocumentGenerationResponse(BaseModel):
    """Response model for document generation"""
    success: bool
    documents: List[GeneratedDocument]
    error: Optional[str] = None


class JobFitAnalysisRequest(BaseModel):
    """Request model for job fit analysis"""
    profile_data: CVProfileData
    job_data: JobData


class JobFitAnalysis(BaseModel):
    """Job fit analysis result"""
    fit_score: int = Field(..., ge=0, le=100)
    match_level: str = Field(..., description="High/Medium/Low")
    strengths: List[str]
    areas_for_improvement: List[str]
    recommendations: List[str]
    analysis: str


class JobFitAnalysisResponse(BaseModel):
    """Response model for job fit analysis"""
    success: bool
    analysis: JobFitAnalysis
    error: Optional[str] = None
