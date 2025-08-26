// Job Copilot Backend - CV Parsing Service
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class CVParsingService {
  constructor() {
    this.supportedFormats = ['pdf', 'docx', 'doc'];
  }

  async parseCV(fileData, fileType) {
    try {
      // Extract text from file based on type
      const extractedText = await this.extractTextFromFile(fileData, fileType);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the file');
      }

      // Use LLM to parse structured data from text
      const parsedData = await this.parseWithLLM(extractedText);
      
      // Validate and clean the parsed data
      const cleanedData = this.validateAndCleanData(parsedData);
      
      logger.info('CV parsing completed', { 
        originalLength: extractedText.length,
        extractedFields: Object.keys(cleanedData).length
      });
      
      return cleanedData;
    } catch (error) {
      logger.error('CV parsing failed', { error: error.message, fileType });
      throw error;
    }
  }

  async extractTextFromFile(fileData, fileType) {
    try {
      // Remove data URL prefix if present
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      switch (fileType.toLowerCase()) {
        case 'application/pdf':
        case 'pdf':
          return await this.extractFromPDF(buffer);
        
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'docx':
          return await this.extractFromDOCX(buffer);
        
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      logger.error('Text extraction failed', { error: error.message, fileType });
      throw new Error(`Failed to extract text from ${fileType} file: ${error.message}`);
    }
  }

  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async extractFromDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  async parseWithLLM(text) {
    try {
      const prompt = this.buildParsingPrompt(text);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert CV/Resume parser. Extract structured information from the provided CV text and return it as valid JSON. Be precise and only extract information that is clearly present in the text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const parsedContent = response.choices[0].message.content;
      
      // Parse the JSON response
      let parsedData;
      try {
        parsedData = JSON.parse(parsedContent);
      } catch (jsonError) {
        // Try to extract JSON from the response if it's wrapped in markdown
        const jsonMatch = parsedContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Invalid JSON response from LLM');
        }
      }

      return parsedData;
    } catch (error) {
      logger.error('LLM parsing failed', { error: error.message });
      throw new Error(`LLM parsing failed: ${error.message}`);
    }
  }

  buildParsingPrompt(text) {
    return `
Please extract the following information from this CV/Resume text and return it as a JSON object:

{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string (city, state/country)",
  "professionalHeadline": "string (job title or professional summary)",
  "profileSummary": "string (professional summary/objective)",
  "workExperience": [
    {
      "jobTitle": "string",
      "company": "string",
      "startDate": "string (MM/YYYY format)",
      "endDate": "string (MM/YYYY format or 'Present')",
      "description": "string",
      "achievements": ["string array of quantifiable achievements"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "startDate": "string (MM/YYYY format)",
      "endDate": "string (MM/YYYY format)",
      "gpa": "string (if mentioned)"
    }
  ],
  "hardSkills": ["array of technical skills"],
  "softSkills": ["array of soft skills"],
  "certifications": ["array of certifications"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of technologies used"]
    }
  ],
  "languages": ["array of languages"],
  "quantifiableAchievements": ["array of achievements with numbers/percentages"]
}

CV/Resume Text:
${text}

Important guidelines:
1. Only extract information that is clearly present in the text
2. Use "Not specified" for missing required fields
3. For dates, use MM/YYYY format
4. Focus on quantifiable achievements (numbers, percentages, dollar amounts)
5. Separate technical skills from soft skills
6. Return valid JSON only, no additional text
`;
  }

  validateAndCleanData(data) {
    const cleaned = {
      fullName: this.cleanString(data.fullName),
      email: this.validateEmail(data.email),
      phone: this.cleanString(data.phone),
      location: this.cleanString(data.location),
      professionalHeadline: this.cleanString(data.professionalHeadline),
      profileSummary: this.cleanString(data.profileSummary),
      workExperience: this.validateWorkExperience(data.workExperience || []),
      education: this.validateEducation(data.education || []),
      hardSkills: this.validateSkillsArray(data.hardSkills || []),
      softSkills: this.validateSkillsArray(data.softSkills || []),
      certifications: this.validateArray(data.certifications || []),
      projects: this.validateProjects(data.projects || []),
      languages: this.validateArray(data.languages || []),
      quantifiableAchievements: this.validateArray(data.quantifiableAchievements || [])
    };

    return cleaned;
  }

  cleanString(str) {
    if (!str || str === 'Not specified') return '';
    return str.trim().replace(/\s+/g, ' ');
  }

  validateEmail(email) {
    if (!email || email === 'Not specified') return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email.toLowerCase() : '';
  }

  validateWorkExperience(experiences) {
    return experiences.map(exp => ({
      jobTitle: this.cleanString(exp.jobTitle),
      company: this.cleanString(exp.company),
      startDate: this.cleanString(exp.startDate),
      endDate: this.cleanString(exp.endDate),
      description: this.cleanString(exp.description),
      achievements: this.validateArray(exp.achievements || [])
    })).filter(exp => exp.jobTitle && exp.company);
  }

  validateEducation(education) {
    return education.map(edu => ({
      degree: this.cleanString(edu.degree),
      institution: this.cleanString(edu.institution),
      startDate: this.cleanString(edu.startDate),
      endDate: this.cleanString(edu.endDate),
      gpa: this.cleanString(edu.gpa)
    })).filter(edu => edu.degree && edu.institution);
  }

  validateSkillsArray(skills) {
    return skills
      .map(skill => this.cleanString(skill))
      .filter(skill => skill.length > 0)
      .slice(0, 20); // Limit to 20 skills
  }

  validateArray(arr) {
    return arr
      .map(item => this.cleanString(item))
      .filter(item => item.length > 0);
  }

  validateProjects(projects) {
    return projects.map(project => ({
      name: this.cleanString(project.name),
      description: this.cleanString(project.description),
      technologies: this.validateArray(project.technologies || [])
    })).filter(project => project.name);
  }

  // Calculate parsing success rate for monitoring
  calculateParsingScore(data) {
    const requiredFields = ['fullName', 'email', 'phone', 'location', 'professionalHeadline'];
    const presentFields = requiredFields.filter(field => data[field] && data[field].length > 0);
    
    const score = (presentFields.length / requiredFields.length) * 100;
    
    logger.info('CV parsing score calculated', { 
      score: Math.round(score),
      presentFields: presentFields.length,
      totalFields: requiredFields.length
    });
    
    return Math.round(score);
  }
}

module.exports = new CVParsingService();
