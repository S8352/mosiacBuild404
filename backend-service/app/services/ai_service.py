"""
AI Service for OpenAI integration and text generation
"""

import asyncio
from typing import Dict, Any, List, Optional
import openai
from openai import AsyncOpenAI
import logging

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AIService:
    """AI service for text generation and analysis"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
    
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate text using OpenAI API
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            
        Returns:
            Generated text
        """
        try:
            messages = []
            
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            messages.append({"role": "user", "content": prompt})
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise
    
    async def generate_cv(self, profile_data: Dict[str, Any], job_data: Dict[str, Any]) -> str:
        """
        Generate tailored CV using AI
        
        Args:
            profile_data: User profile information
            job_data: Job posting information
            
        Returns:
            Generated CV text
        """
        prompt = f"""
        Create a professional CV tailored for this job posting:
        
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Job Description: {job_data.get('description', '')}
        
        Profile Data: {profile_data}
        
        Requirements:
        1. ATS-optimized format
        2. Highlight relevant skills and experience
        3. Use action verbs and quantifiable achievements
        4. Match job requirements
        5. Professional and concise
        """
        
        system_prompt = """
        You are an expert CV writer specializing in ATS-optimized resumes. 
        Create professional, tailored CVs that pass applicant tracking systems.
        """
        
        return await self.generate_text(prompt, system_prompt)
    
    async def generate_cover_letter(self, profile_data: Dict[str, Any], job_data: Dict[str, Any]) -> str:
        """
        Generate tailored cover letter using AI
        
        Args:
            profile_data: User profile information
            job_data: Job posting information
            
        Returns:
            Generated cover letter text
        """
        prompt = f"""
        Create a compelling cover letter for this job:
        
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Job Description: {job_data.get('description', '')}
        
        Profile Data: {profile_data}
        
        Requirements:
        1. Personalized and specific to the company
        2. Highlight relevant experience and skills
        3. Show enthusiasm and cultural fit
        4. Professional tone
        5. Clear call to action
        """
        
        system_prompt = """
        You are an expert cover letter writer. Create compelling, 
        personalized cover letters that demonstrate value and fit.
        """
        
        return await self.generate_text(prompt, system_prompt)
    
    async def analyze_job_fit(self, profile_data: Dict[str, Any], job_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze job fit using AI
        
        Args:
            profile_data: User profile information
            job_data: Job posting information
            
        Returns:
            Job fit analysis
        """
        prompt = f"""
        Analyze the fit between this candidate and job:
        
        Job Title: {job_data.get('title', '')}
        Company: {job_data.get('company', '')}
        Job Description: {job_data.get('description', '')}
        
        Candidate Profile: {profile_data}
        
        Provide analysis with:
        1. Fit score (0-100)
        2. Match level (High/Medium/Low)
        3. Strengths that match the job
        4. Areas for improvement
        5. Specific recommendations
        """
        
        system_prompt = """
        You are an expert recruiter and career advisor. 
        Analyze job-candidate fit objectively and provide actionable insights.
        """
        
        analysis_text = await self.generate_text(prompt, system_prompt)
        
        # Parse the analysis (simplified - could be enhanced with structured output)
        return {
            "analysis": analysis_text,
            "fit_score": self._extract_fit_score(analysis_text),
            "match_level": self._extract_match_level(analysis_text)
        }
    
    def _extract_fit_score(self, text: str) -> int:
        """Extract fit score from analysis text"""
        import re
        score_match = re.search(r'(\d+)', text)
        if score_match:
            score = int(score_match.group(1))
            return min(max(score, 0), 100)
        return 70  # Default score
    
    def _extract_match_level(self, text: str) -> str:
        """Extract match level from analysis text"""
        text_lower = text.lower()
        if 'high' in text_lower:
            return "High"
        elif 'medium' in text_lower:
            return "Medium"
        elif 'low' in text_lower:
            return "Low"
        return "Medium"  # Default


# Create service instance
ai_service = AIService()
