"""
NLP Service for text processing and analysis
"""

import re
from typing import List, Dict, Any, Optional
import logging

from app.core.logging import get_logger

logger = get_logger(__name__)


class NLPService:
    """NLP service for text processing and analysis"""
    
    def __init__(self):
        self.logger = logger
    
    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract named entities from text using regex patterns
        
        Args:
            text: Input text
            
        Returns:
            Dictionary of entity types and their values
        """
        entities = {
            "emails": self._extract_emails(text),
            "phones": self._extract_phones(text),
            "urls": self._extract_urls(text),
            "dates": self._extract_dates(text),
            "locations": self._extract_locations(text),
            "skills": self._extract_skills(text)
        }
        
        return entities
    
    def extract_sections(self, text: str) -> Dict[str, str]:
        """
        Extract different sections from CV text
        
        Args:
            text: CV text
            
        Returns:
            Dictionary of section names and their content
        """
        sections = {}
        lines = text.split('\n')
        
        current_section = ""
        current_content = []
        
        section_keywords = {
            "summary": ["summary", "objective", "profile"],
            "experience": ["experience", "work history", "employment"],
            "education": ["education", "academic", "degree"],
            "skills": ["skills", "competencies", "technologies"],
            "certifications": ["certifications", "certificates"],
            "projects": ["projects", "portfolio"],
            "languages": ["languages", "language skills"]
        }
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Check if line contains section keywords
            for section_name, keywords in section_keywords.items():
                if any(keyword in line_lower for keyword in keywords):
                    if current_section:
                        sections[current_section] = '\n'.join(current_content).strip()
                    current_section = section_name
                    current_content = []
                    break
            else:
                current_content.append(line)
        
        # Add the last section
        if current_section:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return sections
    
    def extract_skills(self, text: str) -> List[str]:
        """
        Extract skills from text
        
        Args:
            text: Input text
            
        Returns:
            List of extracted skills
        """
        # Common technical skills
        technical_skills = [
            "Python", "JavaScript", "Java", "C++", "C#", "PHP", "Ruby", "Go", "Rust",
            "React", "Angular", "Vue", "Node.js", "Django", "Flask", "Spring",
            "MySQL", "PostgreSQL", "MongoDB", "Redis", "AWS", "Azure", "GCP",
            "Docker", "Kubernetes", "Git", "Linux", "Agile", "Scrum"
        ]
        
        found_skills = []
        text_lower = text.lower()
        
        for skill in technical_skills:
            if skill.lower() in text_lower:
                found_skills.append(skill)
        
        return found_skills
    
    def _extract_emails(self, text: str) -> List[str]:
        """Extract email addresses from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        return re.findall(email_pattern, text)
    
    def _extract_phones(self, text: str) -> List[str]:
        """Extract phone numbers from text"""
        phone_pattern = r'(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        matches = re.findall(phone_pattern, text)
        return [''.join(match) for match in matches if any(match)]
    
    def _extract_urls(self, text: str) -> List[str]:
        """Extract URLs from text"""
        url_pattern = r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?'
        return re.findall(url_pattern, text)
    
    def _extract_dates(self, text: str) -> List[str]:
        """Extract dates from text"""
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # MM/DD/YYYY or DD/MM/YYYY
            r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',    # YYYY/MM/DD
            r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b'  # Month DD, YYYY
        ]
        
        dates = []
        for pattern in date_patterns:
            dates.extend(re.findall(pattern, text, re.IGNORECASE))
        
        return dates
    
    def _extract_locations(self, text: str) -> List[str]:
        """Extract location mentions from text"""
        # Simple location extraction - can be enhanced with NER
        location_keywords = [
            "San Francisco", "New York", "London", "Berlin", "Paris", "Tokyo",
            "California", "Texas", "Florida", "Washington", "Massachusetts"
        ]
        
        found_locations = []
        text_lower = text.lower()
        
        for location in location_keywords:
            if location.lower() in text_lower:
                found_locations.append(location)
        
        return found_locations
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts using Jaccard similarity
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        # Tokenize texts
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        # Calculate Jaccard similarity
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if len(union) == 0:
            return 0.0
        
        return len(intersection) / len(union)
    
    def clean_text(self, text: str) -> str:
        """
        Clean and normalize text
        
        Args:
            text: Input text
            
        Returns:
            Cleaned text
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s.,!?;:()]', '', text)
        
        # Normalize line breaks
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        return text.strip()


# Create service instance
nlp_service = NLPService()
