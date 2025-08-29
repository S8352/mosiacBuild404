"""
CV Parsing Service using AI and NLP
"""

import asyncio
from typing import Dict, Any, List, Optional
import logging

from app.core.config import settings
from app.core.logging import get_logger
from app.services.ai_service import AIService

logger = get_logger(__name__)


class CVParsingService:
    """AI-powered CV parsing service"""
    
    def __init__(self):
        self.ai_service = AIService()
    
    async def parse_cv(self, file_data: str, file_type: str) -> Dict[str, Any]:
        """
        Parse CV file and extract structured data
        
        Args:
            file_data: Base64 encoded file data
            file_type: File type (pdf, docx, doc)
            
        Returns:
            Dict containing parsed CV data and feedback
        """
        try:
            logger.info(f"Starting CV parsing for file type: {file_type}")
            
            # Extract text from file
            text = await self._extract_text(file_data, file_type)
            
            # Parse CV data using AI
            cv_data = await self._parse_cv_data(text)
            
            # Generate feedback and analysis
            feedback = await self._generate_feedback(cv_data, text)
            
            logger.info("CV parsing completed successfully")
            
            return {
                "profileData": cv_data,
                "feedback": feedback
            }
            
        except Exception as e:
            logger.error(f"CV parsing failed: {e}", exc_info=True)
            raise
    
    async def _extract_text(self, file_data: str, file_type: str) -> str:
        """Extract text from different file formats"""
        try:
            import base64
            import io
            from PyPDF2 import PdfReader
            from docx import Document
            
            # Decode base64 data
            file_bytes = base64.b64decode(file_data)
            file_io = io.BytesIO(file_bytes)
            
            if file_type.lower() == "pdf":
                pdf_reader = PdfReader(file_io)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
                return text
                
            elif file_type.lower() in ["docx", "doc"]:
                doc = Document(file_io)
                text = ""
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
                return text
                
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
                
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            raise
    
    async def _parse_cv_data(self, text: str) -> Dict[str, Any]:
        """Parse CV text and extract structured data using AI"""
        prompt = f"""
        Parse this CV text and extract structured data. Return as JSON:
        
        CV Text:
        {text}
        
        Extract:
        - full_name: Full name
        - email: Email address
        - phone: Phone number
        - location: Location
        - headline: Job title or headline
        - summary: Professional summary
        - work_experience: Array of work experience objects
        - education: Array of education objects
        - skills: Object with technical and soft skills arrays
        - certifications: Array of certifications
        - projects: Array of projects
        - languages: Array of languages
        - achievements: Array of achievements
        """
        
        try:
            response = await self.ai_service.generate_text(prompt)
            import json
            return json.loads(response)
        except Exception as e:
            logger.error(f"AI parsing failed: {e}")
            return self._fallback_parsing(text)
    
    async def _generate_feedback(self, cv_data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Generate comprehensive CV feedback"""
        prompt = f"""
        Analyze this CV and provide feedback:
        
        CV Data: {cv_data}
        Original Text Length: {len(original_text)} characters
        
        Provide feedback with:
        - score: 0-100 overall score
        - summary: Key statistics
        - extracted_fields: What was successfully extracted
        - missing_fields: Important missing information
        - suggestions: Improvement recommendations
        - confidence: 0-1 confidence in analysis
        - statistics: Detailed metrics
        """
        
        try:
            response = await self.ai_service.generate_text(prompt)
            import json
            return json.loads(response)
        except Exception as e:
            logger.error(f"Feedback generation failed: {e}")
            return self._fallback_feedback(cv_data, original_text)
    
    def _fallback_parsing(self, text: str) -> Dict[str, Any]:
        """Fallback parsing when AI fails"""
        import re
        
        # Basic extraction
        email = self._extract_email(text)
        phone = self._extract_phone(text)
        
        return {
            "full_name": None,
            "email": email,
            "phone": phone,
            "location": None,
            "headline": None,
            "summary": "",
            "work_experience": [],
            "education": [],
            "skills": {"technical": [], "soft": []},
            "certifications": [],
            "projects": [],
            "languages": [],
            "achievements": []
        }
    
    def _fallback_feedback(self, cv_data: Dict[str, Any], original_text: str) -> Dict[str, Any]:
        """Fallback feedback when AI fails"""
        word_count = len(original_text.split())
        
        return {
            "score": 70,
            "summary": {"wordCount": word_count},
            "extracted_fields": {},
            "missing_fields": [],
            "suggestions": ["Consider adding more details to improve your CV"],
            "confidence": 0.7,
            "statistics": {
                "textLength": len(original_text),
                "wordCount": word_count
            }
        }
    
    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text"""
        import re
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, text)
        return match.group() if match else None
    
    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        import re
        phone_pattern = r'(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        match = re.search(phone_pattern, text)
        return match.group() if match else None


# Create service instance
cv_parsing_service = CVParsingService()
