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
      uploadArea.innerHTML = '<div style="color: #2563eb;">📄 Parsing CV...</div>';

      // Convert file to base64 for processing
      const base64 = await this.fileToBase64(file);
      
      // Send to backend for parsing (placeholder for now)
      const parsedData = await this.parseCVFile(base64, file.type);
      
      if (parsedData) {
        this.profileData = { ...this.profileData, ...parsedData };
        await this.saveProfileData();
        this.populateProfileForm();
        this.showProfileForm();
        this.updateProfileScore();
      }
    } catch (error) {
      console.error('Error parsing CV:', error);
      alert('Error parsing CV. Please try manual entry.');
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
    // Placeholder for CV parsing - would integrate with backend LLM service
    // For MVP, we'll simulate parsing with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock parsed data
    return {
      fullName: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      headline: 'Senior Software Engineer',
      // Additional fields would be parsed here
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
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new JobCopilotPopup();
});
