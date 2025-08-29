// Job Copilot Browser Assistant - Popup Script
class JobCopilotPopup {
  constructor() {
    this.currentTab = 'profile';
    this.profileData = {};
    this.currentJob = null;
    this.applications = [];
    
    this.init();
  }

  async init() {
    await this.loadStoredData();
    this.setupEventListeners();
    this.updateUI();
    this.checkForJobDetection();
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(['profileData', 'applications']);
      this.profileData = result.profileData || {};
      this.applications = result.applications || [];
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Upload area
    const uploadArea = document.getElementById('upload-area');
    const cvUpload = document.getElementById('cv-upload');
    
    uploadArea.addEventListener('click', () => cvUpload.click());
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#2563eb';
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.borderColor = '#d1d5db';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '#d1d5db';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    cvUpload.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    // Manual entry button
    document.getElementById('manual-entry-btn').addEventListener('click', () => {
      this.showProfileForm();
    });

    // Save profile button
    document.getElementById('save-profile-btn').addEventListener('click', () => {
      this.saveProfile();
    });

    // Edit profile button
    document.getElementById('edit-profile-btn').addEventListener('click', () => {
      this.editProfile();
    });

    // Generate documents button
    document.getElementById('generate-docs-btn').addEventListener('click', () => {
      this.generateDocuments();
    });

    // Autofill button
    document.getElementById('autofill-btn').addEventListener('click', () => {
      this.autofillApplication();
    });

    // Profile form inputs
    const inputs = ['full-name', 'email', 'phone', 'location', 'headline'];
    inputs.forEach(inputId => {
      document.getElementById(inputId).addEventListener('input', () => {
        this.updateProfileScore();
      });
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;

    // Refresh content based on tab
    if (tabName === 'jobs') {
      this.checkForJobDetection();
    } else if (tabName === 'tracker') {
      this.updateApplicationsTracker();
    }
  }

  async handleFileUpload(file) {
    if (!file.type.includes('pdf') && !file.type.includes('document')) {
      alert('Please upload a PDF or DOCX file');
      return;
    }

    try {
      // Show loading state
      const uploadArea = document.getElementById('upload-area');
      uploadArea.innerHTML = '<div style="color: #2563eb;">📄 Processing your resume...</div>';

      // Convert file to base64 for processing
      const base64 = await this.fileToBase64(file);
      
      // Send to backend for parsing
      const result = await this.parseCVFile(base64, file.type);
      
      if (result && result.profileData) {
        this.profileData = { ...this.profileData, ...result.profileData };
        await this.saveProfileData();
        this.populateProfileForm();
        
        // Show detailed feedback
        this.showResumeProcessingFeedback(result.feedback, result.profileData);
      }
    } catch (error) {
      console.error('Error parsing CV:', error);
      this.showError('Error processing resume. Please try manual entry.');
      this.showProfileForm();
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  async parseCVFile(base64Data, fileType) {
    try {
      // Call backend CV parsing service
      const response = await fetch('http://localhost:3000/api/parse-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileType: fileType
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('CV parsing service error:', error);
      // Fallback to mock data for development
      return this.getMockParsingResult();
    }
  }

  getMockParsingResult() {
    return {
      profileData: {
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        headline: 'Senior Software Engineer',
        summary: 'Experienced software engineer with 5+ years in full-stack development...',
        workExperience: [
          {
            jobTitle: 'Senior Software Engineer',
            company: 'Tech Corp',
            startDate: '01/2020',
            endDate: 'Present',
            description: 'Led development of new features',
            achievements: ['Increased user engagement by 40%', 'Managed team of 5 engineers']
          }
        ],
        education: [
          {
            degree: 'Bachelor of Science',
            institution: 'University of Technology',
            startDate: '09/2015',
            endDate: '05/2019',
            gpa: '3.8'
          }
        ],
        hardSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
        softSkills: ['Leadership', 'Communication', 'Problem Solving'],
        certifications: ['AWS Certified Developer'],
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Built a full-stack e-commerce solution',
            technologies: ['React', 'Node.js', 'MongoDB']
          }
        ],
        languages: ['English', 'Spanish'],
        quantifiableAchievements: ['Increased sales by 25%', 'Reduced deployment time by 60%']
      },
      feedback: {
        score: 85,
        summary: {
          totalExperience: 4.5,
          skillCount: { technical: 5, soft: 3, total: 8 },
          educationLevel: 'Bachelor of Science',
          certifications: 1,
          projects: 1,
          achievements: 2
        },
        extractedFields: {
          basicInfo: { name: true, email: true, phone: true, location: true, headline: true },
          experience: { count: 1, hasCurrent: true, hasAchievements: true },
          education: { count: 1, hasGPA: true },
          skills: { technical: 5, soft: 3, languages: 2 },
          additional: { certifications: 1, projects: 1, achievements: 2 }
        },
        missingFields: ['Professional Summary'],
        suggestions: [
          'Add a professional summary to make your profile more compelling',
          'Consider adding more work experience entries',
          'Add more quantifiable achievements with specific numbers and percentages'
        ],
        confidence: 92,
        statistics: {
          textLength: 2500,
          wordCount: 450,
          extractedFields: 12,
          totalFields: 15,
          experienceYears: 4.5,
          skillDiversity: { total: 8, unique: 8, diversity: 100 }
        }
      }
    };
  }

  showProfileForm() {
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('profile-form').classList.remove('hidden');
    this.updateProfileScore();
  }

  populateProfileForm() {
    if (this.profileData.fullName) {
      document.getElementById('full-name').value = this.profileData.fullName;
    }
    if (this.profileData.email) {
      document.getElementById('email').value = this.profileData.email;
    }
    if (this.profileData.phone) {
      document.getElementById('phone').value = this.profileData.phone;
    }
    if (this.profileData.location) {
      document.getElementById('location').value = this.profileData.location;
    }
    if (this.profileData.headline) {
      document.getElementById('headline').value = this.profileData.headline;
    }
  }

  async saveProfile() {
    const formData = {
      fullName: document.getElementById('full-name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      location: document.getElementById('location').value,
      headline: document.getElementById('headline').value,
    };

    // Validate required fields
    const requiredFields = ['fullName', 'email', 'phone', 'location', 'headline'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert('Please fill in all required fields');
      return;
    }

    this.profileData = { ...this.profileData, ...formData };
    await this.saveProfileData();
    
    // Switch to read-only mode
    document.getElementById('save-profile-btn').style.display = 'none';
    document.getElementById('edit-profile-btn').style.display = 'block';
    
    // Disable form inputs
    document.querySelectorAll('.form-input').forEach(input => {
      input.disabled = true;
    });

    this.updateProfileScore();
  }

  editProfile() {
    document.getElementById('save-profile-btn').style.display = 'block';
    document.getElementById('edit-profile-btn').style.display = 'none';
    
    // Enable form inputs
    document.querySelectorAll('.form-input').forEach(input => {
      input.disabled = false;
    });
  }

  async saveProfileData() {
    try {
      await chrome.storage.local.set({ profileData: this.profileData });
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  }

  updateProfileScore() {
    const requiredFields = ['fullName', 'email', 'phone', 'location', 'headline'];
    const currentValues = requiredFields.map(field => {
      const element = document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());
      return element ? element.value : this.profileData[field];
    });

    const completedFields = currentValues.filter(value => value && value.trim()).length;
    const score = Math.round((completedFields / requiredFields.length) * 100);

    document.getElementById('profile-score').textContent = `${score}%`;
    document.getElementById('progress-fill').style.width = `${score}%`;
  }

  async checkForJobDetection() {
    try {
      // Query the active tab to check if we're on a LinkedIn job page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url && tab.url.includes('linkedin.com/jobs')) {
        // Send message to content script to get job data
        chrome.tabs.sendMessage(tab.id, { action: 'getJobData' }, (response) => {
          if (response && response.jobData) {
            this.currentJob = response.jobData;
            this.showJobDetected();
          } else {
            this.showNoJobDetected();
          }
        });
      } else {
        this.showNoJobDetected();
      }
    } catch (error) {
      console.error('Error checking for job detection:', error);
      this.showNoJobDetected();
    }
  }

  showJobDetected() {
    document.getElementById('no-job-detected').classList.add('hidden');
    document.getElementById('job-detected').classList.remove('hidden');
    
    if (this.currentJob) {
      document.getElementById('detected-job-title').textContent = this.currentJob.title || 'Job Title';
      document.getElementById('detected-job-company').textContent = this.currentJob.company || 'Company';
      
      // Calculate and show fit score
      const fitScore = this.calculateFitScore();
      const fitElement = document.getElementById('fit-score');
      fitElement.textContent = `${fitScore.level} Fit`;
      fitElement.className = `fit-score fit-${fitScore.level.toLowerCase()}`;
    }
  }

  showNoJobDetected() {
    document.getElementById('no-job-detected').classList.remove('hidden');
    document.getElementById('job-detected').classList.add('hidden');
  }

  calculateFitScore() {
    // Placeholder fit score calculation
    // In real implementation, this would use semantic analysis
    if (!this.currentJob || !this.profileData.headline) {
      return { level: 'Medium', explanation: 'Complete your profile for better analysis' };
    }

    // Simple keyword matching for MVP
    const jobKeywords = (this.currentJob.description || '').toLowerCase().split(' ');
    const profileKeywords = (this.profileData.headline || '').toLowerCase().split(' ');
    
    const matches = jobKeywords.filter(keyword => 
      profileKeywords.some(profileWord => profileWord.includes(keyword))
    ).length;

    if (matches > 3) {
      return { level: 'High', explanation: 'Strong keyword match' };
    } else if (matches > 1) {
      return { level: 'Medium', explanation: 'Some relevant skills' };
    } else {
      return { level: 'Low', explanation: 'Limited skill overlap' };
    }
  }

  async generateDocuments() {
    if (!this.profileData.fullName) {
      alert('Please complete your profile first');
      this.switchTab('profile');
      return;
    }

    try {
      // Show loading state
      const btn = document.getElementById('generate-docs-btn');
      const originalText = btn.textContent;
      btn.textContent = 'Generating...';
      btn.disabled = true;

      // Call backend service to generate CV and cover letter
      const documents = await this.callDocumentGenerationService();
      
      if (documents) {
        // Download generated documents
        this.downloadDocument(documents.cv, 'tailored-cv.pdf');
        this.downloadDocument(documents.coverLetter, 'cover-letter.pdf');
        
        alert('Documents generated and downloaded successfully!');
      }
    } catch (error) {
      console.error('Error generating documents:', error);
      alert('Error generating documents. Please try again.');
    } finally {
      const btn = document.getElementById('generate-docs-btn');
      btn.textContent = 'Generate Tailored CV & Cover Letter';
      btn.disabled = false;
    }
  }

  async callDocumentGenerationService() {
    // Placeholder for backend API call
    // Would integrate with AWS Fargate microservice
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return {
      cv: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago=',
      coverLetter: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago='
    };
  }

  downloadDocument(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async autofillApplication() {
    try {
      // Send message to content script to perform autofill
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      chrome.tabs.sendMessage(tab.id, {
        action: 'autofillForm',
        profileData: this.profileData
      }, (response) => {
        if (response && response.success) {
          alert('Form auto-filled successfully!');
          
          // Track this application
          this.trackApplication();
        } else {
          alert('Some fields could not be auto-filled. Please complete manually.');
        }
      });
    } catch (error) {
      console.error('Error auto-filling form:', error);
      alert('Error auto-filling form. Please try again.');
    }
  }

  async trackApplication() {
    if (!this.currentJob) return;

    const application = {
      id: Date.now().toString(),
      jobTitle: this.currentJob.title,
      company: this.currentJob.company,
      dateApplied: new Date().toISOString(),
      status: 'applied',
      url: this.currentJob.url
    };

    this.applications.unshift(application);
    
    try {
      await chrome.storage.local.set({ applications: this.applications });
    } catch (error) {
      console.error('Error saving application:', error);
    }
  }

  updateApplicationsTracker() {
    const noAppsElement = document.getElementById('no-applications');
    const appsListElement = document.getElementById('applications-list');

    if (this.applications.length === 0) {
      noAppsElement.classList.remove('hidden');
      appsListElement.classList.add('hidden');
    } else {
      noAppsElement.classList.add('hidden');
      appsListElement.classList.remove('hidden');
      
      appsListElement.innerHTML = this.applications.map(app => `
        <div class="job-card">
          <div class="job-title">${app.jobTitle}</div>
          <div class="job-company">${app.company}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <div>
              <span class="status-indicator status-${app.status}"></span>
              <span style="text-transform: capitalize; font-size: 12px; color: #6b7280;">${app.status}</span>
            </div>
            <div style="font-size: 12px; color: #9ca3af;">
              ${new Date(app.dateApplied).toLocaleDateString()}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  updateUI() {
    // Update profile completeness on load
    this.updateProfileScore();
    
    // Show appropriate profile section
    if (Object.keys(this.profileData).length > 0 && this.profileData.fullName) {
      this.populateProfileForm();
      this.showProfileForm();
      
      // Set to read-only mode if profile is complete
      const requiredFields = ['fullName', 'email', 'phone', 'location', 'headline'];
      const isComplete = requiredFields.every(field => this.profileData[field]);
      
      if (isComplete) {
        document.getElementById('save-profile-btn').style.display = 'none';
        document.getElementById('edit-profile-btn').style.display = 'block';
        document.querySelectorAll('.form-input').forEach(input => {
          input.disabled = true;
        });
      }
    }
    
    // Update applications tracker
    this.updateApplicationsTracker();
  }

  showResumeProcessingFeedback(feedback, profileData) {
    // Create feedback modal
    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.innerHTML = this.createFeedbackHTML(feedback, profileData);
    
    document.body.appendChild(modal);
    
    // Add event listeners
    this.setupFeedbackModalListeners(modal, feedback, profileData);
  }

  createFeedbackHTML(feedback, profileData) {
    return `
      <div class="feedback-overlay">
        <div class="feedback-container">
          <div class="feedback-header">
            <h2>📄 Resume Processing Complete</h2>
            <button class="close-feedback-btn">×</button>
          </div>
          
          <div class="feedback-content">
            <!-- Visual Score Display -->
            <div class="feedback-section">
              <div class="score-display">
                <div class="score-circle score-${this.getScoreClass(feedback.score)}">
                  <span class="score-number">${feedback.score}%</span>
                  <span class="score-label">Success Rate</span>
                </div>
                <div class="confidence-indicator">
                  <span class="confidence-label">Confidence:</span>
                  <span class="confidence-value">${feedback.confidence}%</span>
                </div>
              </div>
            </div>

            <!-- Comprehensive Summary -->
            <div class="feedback-section">
              <h3>📊 Summary</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-icon">💼</span>
                  <span class="summary-value">${feedback.summary.totalExperience} years</span>
                  <span class="summary-label">Experience</span>
                </div>
                <div class="summary-item">
                  <span class="summary-icon">🛠️</span>
                  <span class="summary-value">${feedback.summary.skillCount.total}</span>
                  <span class="summary-label">Skills</span>
                </div>
                <div class="summary-item">
                  <span class="summary-icon">🎓</span>
                  <span class="summary-value">${feedback.summary.educationLevel}</span>
                  <span class="summary-label">Education</span>
                </div>
                <div class="summary-item">
                  <span class="summary-icon">🏆</span>
                  <span class="summary-value">${feedback.summary.achievements}</span>
                  <span class="summary-label">Achievements</span>
                </div>
              </div>
            </div>

            <!-- Detailed Extraction Report -->
            <div class="feedback-section">
              <h3>✅ Extracted Information</h3>
              <div class="extracted-info">
                ${this.createExtractedInfoHTML(feedback.extractedFields)}
              </div>
            </div>

            <!-- Missing Information Alerts -->
            ${feedback.missingFields.length > 0 ? `
              <div class="feedback-section">
                <h3>⚠️ Missing Information</h3>
                <div class="missing-fields">
                  ${feedback.missingFields.map(field => `
                    <div class="missing-field">
                      <span class="missing-icon">⚠️</span>
                      <span>${field}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Suggestions -->
            ${feedback.suggestions.length > 0 ? `
              <div class="feedback-section">
                <h3>💡 Suggestions for Improvement</h3>
                <div class="suggestions-list">
                  ${feedback.suggestions.map(suggestion => `
                    <div class="suggestion-item">
                      <span class="suggestion-icon">💡</span>
                      <span>${suggestion}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Detailed Statistics -->
            <div class="feedback-section">
              <h3>📈 Detailed Statistics</h3>
              <div class="statistics-grid">
                <div class="stat-item">
                  <span class="stat-label">Text Length:</span>
                  <span class="stat-value">${feedback.statistics.textLength.toLocaleString()} characters</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Word Count:</span>
                  <span class="stat-value">${feedback.statistics.wordCount.toLocaleString()} words</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Fields Extracted:</span>
                  <span class="stat-value">${feedback.statistics.extractedFields}/${feedback.statistics.totalFields}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Skill Diversity:</span>
                  <span class="stat-value">${feedback.statistics.skillDiversity.diversity}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="feedback-actions">
            <button class="btn btn-secondary" id="edit-extracted-data-btn">
              Edit Extracted Data
            </button>
            <button class="btn btn-primary" id="continue-with-data-btn">
              Continue with Extracted Data
            </button>
          </div>
        </div>
      </div>
    `;
  }

  createExtractedInfoHTML(extractedFields) {
    return `
      <div class="extracted-grid">
        <div class="extracted-category">
          <h4>👤 Basic Information</h4>
          <div class="extracted-items">
            ${Object.entries(extractedFields.basicInfo).map(([field, extracted]) => `
              <div class="extracted-item ${extracted ? 'extracted' : 'missing'}">
                <span class="item-icon">${extracted ? '✅' : '❌'}</span>
                <span class="item-label">${this.formatFieldName(field)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="extracted-category">
          <h4>💼 Work Experience</h4>
          <div class="extracted-items">
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.experience.count} positions</span>
            </div>
            <div class="extracted-item ${extractedFields.experience.hasCurrent ? 'extracted' : 'missing'}">
              <span class="item-icon">${extractedFields.experience.hasCurrent ? '✅' : '❌'}</span>
              <span class="item-label">Current position</span>
            </div>
            <div class="extracted-item ${extractedFields.experience.hasAchievements ? 'extracted' : 'missing'}">
              <span class="item-icon">${extractedFields.experience.hasAchievements ? '✅' : '❌'}</span>
              <span class="item-label">Achievements</span>
            </div>
          </div>
        </div>
        
        <div class="extracted-category">
          <h4>🎓 Education</h4>
          <div class="extracted-items">
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.education.count} institutions</span>
            </div>
            <div class="extracted-item ${extractedFields.education.hasGPA ? 'extracted' : 'missing'}">
              <span class="item-icon">${extractedFields.education.hasGPA ? '✅' : '❌'}</span>
              <span class="item-label">GPA information</span>
            </div>
          </div>
        </div>
        
        <div class="extracted-category">
          <h4>🛠️ Skills</h4>
          <div class="extracted-items">
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.skills.technical} technical skills</span>
            </div>
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.skills.soft} soft skills</span>
            </div>
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.skills.languages} languages</span>
            </div>
          </div>
        </div>
        
        <div class="extracted-category">
          <h4>🏆 Additional</h4>
          <div class="extracted-items">
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.additional.certifications} certifications</span>
            </div>
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.additional.projects} projects</span>
            </div>
            <div class="extracted-item extracted">
              <span class="item-icon">✅</span>
              <span class="item-label">${extractedFields.additional.achievements} achievements</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  formatFieldName(field) {
    const fieldNames = {
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      location: 'Location',
      headline: 'Professional Headline'
    };
    return fieldNames[field] || field;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  }

  setupFeedbackModalListeners(modal, feedback, profileData) {
    // Close button
    const closeBtn = modal.querySelector('.close-feedback-btn');
    closeBtn.addEventListener('click', () => {
      modal.remove();
      this.showProfileForm();
    });

    // Edit extracted data button
    const editBtn = modal.querySelector('#edit-extracted-data-btn');
    editBtn.addEventListener('click', () => {
      modal.remove();
      this.showProfileForm();
      this.populateProfileForm();
    });

    // Continue with data button
    const continueBtn = modal.querySelector('#continue-with-data-btn');
    continueBtn.addEventListener('click', () => {
      modal.remove();
      this.showProfileForm();
      this.populateProfileForm();
      this.updateProfileScore();
    });

    // Close on overlay click
    const overlay = modal.querySelector('.feedback-overlay');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        modal.remove();
        this.showProfileForm();
      }
    });
  }

  showError(message) {
    alert(message);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new JobCopilotPopup();
});
