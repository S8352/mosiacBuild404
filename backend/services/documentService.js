// Job Copilot Backend - Document Generation Service
const OpenAI = require('openai');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class DocumentService {
  constructor() {
    this.atsOptimizationRules = {
      fonts: ['Arial', 'Calibri', 'Times New Roman', 'Georgia'],
      fontSize: { min: 10, max: 12 },
      margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      maxPages: 2,
      avoidElements: ['tables', 'text-boxes', 'headers', 'footers', 'images', 'graphics'],
      formatting: {
        singleColumn: true,
        leftAligned: true,
        standardBullets: true,
        noSpecialCharacters: true
      }
    };
  }

  async generateDocuments({ profileData, jobData, documentTypes }) {
    try {
      const documents = {};

      for (const docType of documentTypes) {
        switch (docType) {
          case 'cv':
            documents.cv = await this.generateTailoredCV(profileData, jobData);
            break;
          case 'coverLetter':
            documents.coverLetter = await this.generateCoverLetter(profileData, jobData);
            break;
          default:
            logger.warn('Unknown document type requested', { docType });
        }
      }

      return documents;
    } catch (error) {
      logger.error('Document generation failed', { error: error.message });
      throw error;
    }
  }

  async generateTailoredCV(profileData, jobData) {
    try {
      // Generate CV content using LLM
      const cvContent = await this.generateCVContent(profileData, jobData);
      
      // Create ATS-optimized PDF
      const pdfBuffer = await this.createATSOptimizedPDF(cvContent, 'cv');
      
      return {
        content: cvContent,
        pdf: pdfBuffer.toString('base64'),
        filename: `${profileData.fullName?.replace(/\s+/g, '_')}_CV_${jobData.company?.replace(/\s+/g, '_')}.pdf`,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      logger.error('CV generation failed', { error: error.message });
      throw error;
    }
  }

  async generateCVContent(profileData, jobData) {
    const prompt = this.buildCVPrompt(profileData, jobData);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert CV writer specializing in ATS-optimized resumes. Create a tailored CV that:
1. Incorporates keywords from the job description naturally
2. Highlights relevant experience and achievements
3. Uses action verbs and quantifiable results
4. Follows ATS-friendly formatting guidelines
5. Is professional and compelling to human recruiters`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2500
    });

    return this.parseStructuredCVContent(response.choices[0].message.content);
  }

  buildCVPrompt(profileData, jobData) {
    return `
Create a tailored CV for the following job application:

JOB DETAILS:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Key Requirements: ${jobData.skills?.join(', ') || 'Not specified'}
- Job Description: ${jobData.description?.substring(0, 1000) || 'Not specified'}

CANDIDATE PROFILE:
- Name: ${profileData.fullName}
- Email: ${profileData.email}
- Phone: ${profileData.phone}
- Location: ${profileData.location}
- Professional Headline: ${profileData.professionalHeadline}
- Summary: ${profileData.profileSummary}
- Work Experience: ${JSON.stringify(profileData.workExperience || [])}
- Education: ${JSON.stringify(profileData.education || [])}
- Hard Skills: ${profileData.hardSkills?.join(', ') || 'Not specified'}
- Soft Skills: ${profileData.softSkills?.join(', ') || 'Not specified'}
- Achievements: ${profileData.quantifiableAchievements?.join(', ') || 'Not specified'}

REQUIREMENTS:
1. Include at least 3 keywords from the job description naturally in the CV
2. Prioritize relevant experience and skills
3. Use quantifiable achievements where possible
4. Keep it to 1-2 pages maximum
5. Use professional, ATS-friendly language
6. Structure: Contact Info, Professional Summary, Work Experience, Education, Skills

Return the CV in this JSON format:
{
  "contactInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string"
  },
  "professionalSummary": "string (2-3 sentences highlighting key qualifications)",
  "workExperience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "achievements": ["array of bullet points with quantifiable results"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "year": "string"
    }
  ],
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"]
  }
}
`;
  }

  parseStructuredCVContent(content) {
    try {
      // Try to parse JSON from the response
      let jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        jsonMatch = content.match(/\{[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      // Fallback: return structured content
      return {
        contactInfo: {
          name: "Generated CV",
          email: "",
          phone: "",
          location: ""
        },
        professionalSummary: content.substring(0, 300),
        workExperience: [],
        education: [],
        skills: { technical: [], soft: [] }
      };
    } catch (error) {
      logger.error('Failed to parse CV content', { error: error.message });
      throw new Error('Failed to parse generated CV content');
    }
  }

  async generateCoverLetter(profileData, jobData) {
    try {
      const coverLetterContent = await this.generateCoverLetterContent(profileData, jobData);
      const pdfBuffer = await this.createATSOptimizedPDF(coverLetterContent, 'coverLetter');
      
      return {
        content: coverLetterContent,
        pdf: pdfBuffer.toString('base64'),
        filename: `${profileData.fullName?.replace(/\s+/g, '_')}_CoverLetter_${jobData.company?.replace(/\s+/g, '_')}.pdf`,
        mimeType: 'application/pdf'
      };
    } catch (error) {
      logger.error('Cover letter generation failed', { error: error.message });
      throw error;
    }
  }

  async generateCoverLetterContent(profileData, jobData) {
    const prompt = `
Write a compelling cover letter for this job application:

JOB DETAILS:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Key Requirements: ${jobData.skills?.join(', ') || 'Not specified'}

CANDIDATE PROFILE:
- Name: ${profileData.fullName}
- Professional Headline: ${profileData.professionalHeadline}
- Key Achievements: ${profileData.quantifiableAchievements?.slice(0, 3).join(', ') || 'Not specified'}
- Relevant Experience: ${profileData.workExperience?.[0]?.jobTitle || 'Not specified'}

REQUIREMENTS:
1. Professional tone, 3-4 paragraphs
2. Highlight specific achievements with numbers
3. Show enthusiasm for the role and company
4. Connect candidate's experience to job requirements
5. Include a strong call to action
6. Keep it concise (under 400 words)

Return as plain text, properly formatted for a business letter.
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert cover letter writer. Create compelling, personalized cover letters that showcase the candidate\'s value proposition and enthusiasm for the role.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 800
    });

    return response.choices[0].message.content;
  }

  async createATSOptimizedPDF(content, documentType) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 36,    // 0.5 inch
            bottom: 36,
            left: 36,
            right: 36
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Set ATS-friendly font
        doc.font('Helvetica');

        if (documentType === 'cv') {
          this.renderCVToPDF(doc, content);
        } else if (documentType === 'coverLetter') {
          this.renderCoverLetterToPDF(doc, content);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  renderCVToPDF(doc, cvContent) {
    let yPosition = 50;

    // Contact Information
    if (cvContent.contactInfo) {
      doc.fontSize(16).text(cvContent.contactInfo.name || 'Name', 50, yPosition);
      yPosition += 25;
      
      const contactDetails = [
        cvContent.contactInfo.email,
        cvContent.contactInfo.phone,
        cvContent.contactInfo.location
      ].filter(Boolean).join(' | ');
      
      doc.fontSize(10).text(contactDetails, 50, yPosition);
      yPosition += 30;
    }

    // Professional Summary
    if (cvContent.professionalSummary) {
      doc.fontSize(12).text('PROFESSIONAL SUMMARY', 50, yPosition);
      yPosition += 20;
      doc.fontSize(10).text(cvContent.professionalSummary, 50, yPosition, { width: 500 });
      yPosition += 40;
    }

    // Work Experience
    if (cvContent.workExperience?.length > 0) {
      doc.fontSize(12).text('WORK EXPERIENCE', 50, yPosition);
      yPosition += 20;

      cvContent.workExperience.forEach(job => {
        doc.fontSize(11).text(`${job.title} - ${job.company}`, 50, yPosition);
        doc.fontSize(9).text(job.duration, 400, yPosition);
        yPosition += 15;

        job.achievements?.forEach(achievement => {
          doc.fontSize(10).text(`• ${achievement}`, 70, yPosition, { width: 480 });
          yPosition += 15;
        });
        yPosition += 10;
      });
    }

    // Education
    if (cvContent.education?.length > 0) {
      doc.fontSize(12).text('EDUCATION', 50, yPosition);
      yPosition += 20;

      cvContent.education.forEach(edu => {
        doc.fontSize(10).text(`${edu.degree} - ${edu.institution} (${edu.year})`, 50, yPosition);
        yPosition += 15;
      });
      yPosition += 10;
    }

    // Skills
    if (cvContent.skills) {
      doc.fontSize(12).text('SKILLS', 50, yPosition);
      yPosition += 20;

      if (cvContent.skills.technical?.length > 0) {
        doc.fontSize(10).text(`Technical: ${cvContent.skills.technical.join(', ')}`, 50, yPosition, { width: 500 });
        yPosition += 15;
      }

      if (cvContent.skills.soft?.length > 0) {
        doc.fontSize(10).text(`Soft Skills: ${cvContent.skills.soft.join(', ')}`, 50, yPosition, { width: 500 });
      }
    }
  }

  renderCoverLetterToPDF(doc, content) {
    const lines = content.split('\n');
    let yPosition = 50;

    lines.forEach(line => {
      if (line.trim()) {
        doc.fontSize(11).text(line, 50, yPosition, { width: 500, align: 'left' });
        yPosition += 20;
      } else {
        yPosition += 10; // Add space for empty lines
      }
    });
  }

  async analyzeFit(profileData, jobData) {
    try {
      const prompt = `
Analyze the fit between this candidate and job:

JOB:
- Title: ${jobData.title}
- Company: ${jobData.company}
- Required Skills: ${jobData.skills?.join(', ') || 'Not specified'}
- Description: ${jobData.description?.substring(0, 500) || 'Not specified'}

CANDIDATE:
- Headline: ${profileData.professionalHeadline}
- Skills: ${[...(profileData.hardSkills || []), ...(profileData.softSkills || [])].join(', ')}
- Experience: ${profileData.workExperience?.[0]?.jobTitle || 'Not specified'}

Provide analysis in JSON format:
{
  "fitScore": "High|Medium|Low",
  "matchingSkills": ["array of matching skills"],
  "missingSkills": ["array of missing key skills"],
  "strengths": ["array of candidate strengths for this role"],
  "recommendations": ["array of improvement suggestions"]
}
`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert recruiter analyzing candidate-job fit. Provide objective, actionable analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis
      return {
        fitScore: 'Medium',
        matchingSkills: [],
        missingSkills: [],
        strengths: ['Professional experience'],
        recommendations: ['Complete profile for better analysis']
      };
    } catch (error) {
      logger.error('Fit analysis failed', { error: error.message });
      throw error;
    }
  }
}

module.exports = new DocumentService();
