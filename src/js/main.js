// Job Copilot - Main JavaScript Entry Point

// Import utility modules
import './utils/storage.js';
import './utils/voice.js';
import './utils/validation.js';

// Main application class
class JobCopilotApp {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.selectedMethod = null;
    this.profileData = {};
    this.isInitialized = false;
    
    // Initialize managers
    this.storage = window.storageManager;
    this.voice = window.voiceManager;
    this.validation = window.validationManager;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('Initializing Job Copilot...');
      
      // Initialize voice manager
      this.voice.init();
      
      // Load existing profile data
      await this.loadProfileData();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Initialize form validation
      this.initFormValidation();
      
      // Update UI
      this.updateProgress();
      this.updateStepContent();
      
      this.isInitialized = true;
      console.log('Job Copilot initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Job Copilot:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Method selection
    document.querySelectorAll('.method-card').forEach(card => {
      card.addEventListener('click', () => this.selectMethod(card.dataset.method));
    });

    // File upload
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Voice buttons
    document.querySelectorAll('.voice-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = button.dataset.target;
        const fieldType = button.dataset.fieldType || 'text';
        const target = document.getElementById(targetId);
        if (target) {
          this.voice.handleVoiceButtonClick(target, fieldType);
        }
      });
    });

    // Navigation buttons
    const nextBtn = document.querySelector('.btn-next');
    const prevBtn = document.querySelector('.btn-prev');
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prevStep());
    }

    // Skills management
    this.initSkillsManagement();
    
    // Experience management
    this.initExperienceManagement();
    
    // Form submission
    const form = document.querySelector('.onboarding-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
  }

  /**
   * Initialize form validation
   */
  initFormValidation() {
    const form = document.querySelector('.onboarding-form');
    if (form) {
      const schema = this.validation.getOnboardingValidationSchema();
      this.validation.validateFormRealTime(form, schema);
    }
  }

  /**
   * Initialize skills management
   */
  initSkillsManagement() {
    const skillsContainer = document.querySelector('.skills-input-container');
    const addSkillInput = document.querySelector('.add-skill-input');
    
    if (addSkillInput) {
      addSkillInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addSkill();
        }
      });
    }
  }

  /**
   * Initialize experience management
   */
  initExperienceManagement() {
    // Add experience button
    const addExperienceBtn = document.querySelector('.btn-add-experience');
    if (addExperienceBtn) {
      addExperienceBtn.addEventListener('click', () => this.addExperience());
    }
  }

  /**
   * Load existing profile data
   */
  async loadProfileData() {
    try {
      const profile = await this.storage.getProfile();
      if (profile) {
        this.profileData = profile;
        this.populateFormData();
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  }

  /**
   * Populate form with existing data
   */
  populateFormData() {
    Object.entries(this.profileData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });

    // Populate skills
    if (this.profileData.skills) {
      this.populateSkills(this.profileData.skills);
    }

    // Populate experience
    if (this.profileData.experience) {
      this.populateExperience(this.profileData.experience);
    }
  }

  /**
   * Select input method
   * @param {string} method - Selected method
   */
  selectMethod(method) {
    this.selectedMethod = method;
    
    // Update UI
    document.querySelectorAll('.method-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-method="${method}"]`);
    if (selectedCard) {
      selectedCard.classList.add('selected');
    }

    // Show/hide upload area
    const uploadArea = document.getElementById('upload-area');
    if (uploadArea) {
      uploadArea.style.display = method === 'upload' ? 'block' : 'none';
    }

    // Enable next button
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
      nextBtn.disabled = false;
    }
  }

  /**
   * Handle file upload
   * @param {Event} event - File input event
   */
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = this.validation.validateFile(file);
    if (!validation.isValid) {
      this.showError(validation.firstError);
      return;
    }

    try {
      // Show loading state
      this.showLoading('Processing your resume...');
      
      // Simulate file processing
      await this.simulateFileProcessing(file);
      
      // Extract data (simulated)
      const extractedData = await this.extractDataFromFile(file);
      
      // Populate form with extracted data
      this.populateFormWithExtractedData(extractedData);
      
      // Hide loading
      this.hideLoading();
      
      // Show success message
      this.showSuccess('Resume processed successfully!');
      
    } catch (error) {
      console.error('File processing error:', error);
      this.hideLoading();
      this.showError('Failed to process resume. Please try again.');
    }
  }

  /**
   * Simulate file processing
   * @param {File} file - File to process
   */
  async simulateFileProcessing(file) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Processing file: ${file.name}`);
        resolve();
      }, 2000);
    });
  }

  /**
   * Extract data from file (simulated)
   * @param {File} file - File to extract data from
   * @returns {Object} Extracted data
   */
  async extractDataFromFile(file) {
    // This would normally use AI/ML to extract data
    // For now, return simulated data
    return {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      headline: 'Senior Software Engineer',
      summary: 'Experienced software engineer with 5+ years in full-stack development...',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
      experience: [
        {
          jobTitle: 'Senior Software Engineer',
          company: 'Tech Corp',
          startDate: '2020-01',
          endDate: '',
          current: true,
          achievements: 'Led development of new features, managed team of 5 engineers'
        }
      ]
    };
  }

  /**
   * Populate form with extracted data
   * @param {Object} data - Extracted data
   */
  populateFormWithExtractedData(data) {
    Object.entries(data).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
      }
    });

    // Handle arrays
    if (data.skills) {
      this.populateSkills(data.skills);
    }

    if (data.experience) {
      this.populateExperience(data.experience);
    }
  }

  /**
   * Populate skills
   * @param {Array} skills - Skills array
   */
  populateSkills(skills) {
    const container = document.querySelector('.skills-input-container');
    if (!container) return;

    // Clear existing skills
    container.innerHTML = '';

    skills.forEach(skill => {
      this.addSkillTag(skill);
    });
  }

  /**
   * Populate experience
   * @param {Array} experience - Experience array
   */
  populateExperience(experience) {
    const container = document.getElementById('experience-container');
    if (!container) return;

    // Clear existing experience
    container.innerHTML = '';

    experience.forEach((exp, index) => {
      this.addExperienceCard(exp, index);
    });
  }

  /**
   * Add skill
   */
  addSkill() {
    const input = document.querySelector('.add-skill-input');
    if (!input || !input.value.trim()) return;

    const skill = input.value.trim();
    this.addSkillTag(skill);
    input.value = '';
  }

  /**
   * Add skill tag
   * @param {string} skill - Skill to add
   */
  addSkillTag(skill) {
    const container = document.querySelector('.skills-input-container');
    if (!container) return;

    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.innerHTML = `
      ${skill}
      <button onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(tag);
  }

  /**
   * Add experience card
   * @param {Object} experience - Experience data
   * @param {number} index - Experience index
   */
  addExperienceCard(experience = {}, index = 0) {
    const container = document.getElementById('experience-container');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'experience-card';
    card.innerHTML = `
      <div class="card-header">
        <h4>Position ${index + 1}</h4>
        <button class="btn btn-secondary btn-sm" onclick="this.closest('.experience-card').remove()">Remove</button>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Job Title <span class="required">*</span></label>
          <div class="voice-input-wrapper">
            <input type="text" class="form-input" name="jobTitle" value="${experience.jobTitle || ''}" placeholder="e.g., Software Engineer">
            <button class="voice-button" data-target="jobTitle" data-field-type="text">🎤</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Company <span class="required">*</span></label>
          <div class="voice-input-wrapper">
            <input type="text" class="form-input" name="company" value="${experience.company || ''}" placeholder="Company name">
            <button class="voice-button" data-target="company" data-field-type="text">🎤</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="month" class="form-input" name="startDate" value="${experience.startDate || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">End Date</label>
          <input type="month" class="form-input" name="endDate" value="${experience.endDate || ''}">
          <label style="display: flex; align-items: center; gap: 5px; margin-top: 8px;">
            <input type="checkbox" name="current" ${experience.current ? 'checked' : ''}> Currently working here
          </label>
        </div>
      </div>
      <div class="form-group" style="margin-top: 15px;">
        <label class="form-label">Key Achievements & Responsibilities</label>
        <div class="voice-input-wrapper">
          <textarea class="form-textarea" name="achievements" placeholder="• Led development of new feature that increased user engagement by 40%&#10;• Managed team of 5 engineers&#10;• Implemented CI/CD pipeline reducing deployment time by 60%">${experience.achievements || ''}</textarea>
          <button class="voice-button" data-target="achievements" data-field-type="text" style="top: 30px;">🎤</button>
        </div>
        <span class="help-text">Use bullet points and include quantifiable results</span>
      </div>
    `;

    container.appendChild(card);
  }

  /**
   * Add experience
   */
  addExperience() {
    this.addExperienceCard();
  }

  /**
   * Next step
   */
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      // Validate current step
      if (this.validateCurrentStep()) {
        this.currentStep++;
        this.updateProgress();
        this.updateStepContent();
      }
    }
  }

  /**
   * Previous step
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateProgress();
      this.updateStepContent();
    }
  }

  /**
   * Validate current step
   * @returns {boolean} Validation result
   */
  validateCurrentStep() {
    const formData = this.getFormData();
    const schema = this.validation.getOnboardingValidationSchema();
    const result = this.validation.validateForm(formData, schema);

    if (!result.isValid) {
      this.showValidationErrors(result.errors);
      return false;
    }

    return true;
  }

  /**
   * Get form data
   * @returns {Object} Form data
   */
  getFormData() {
    const formData = {};
    const form = document.querySelector('.onboarding-form');
    
    if (form) {
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        if (input.name) {
          if (input.type === 'checkbox') {
            formData[input.name] = input.checked;
          } else {
            formData[input.name] = input.value;
          }
        }
      });
    }

    // Get skills
    const skillTags = document.querySelectorAll('.skill-tag');
    formData.skills = Array.from(skillTags).map(tag => tag.textContent.trim().replace('×', ''));

    // Get experience
    const experienceCards = document.querySelectorAll('.experience-card');
    formData.experience = Array.from(experienceCards).map(card => {
      const inputs = card.querySelectorAll('input, textarea');
      const experience = {};
      inputs.forEach(input => {
        if (input.name) {
          if (input.type === 'checkbox') {
            experience[input.name] = input.checked;
          } else {
            experience[input.name] = input.value;
          }
        }
      });
      return experience;
    });

    return formData;
  }

  /**
   * Show validation errors
   * @param {Object} errors - Validation errors
   */
  showValidationErrors(errors) {
    const errorList = Object.entries(errors)
      .map(([field, fieldErrors]) => `<li><strong>${field}:</strong> ${fieldErrors.join(', ')}</li>`)
      .join('');
    
    this.showError(`Please fix the following errors:<ul>${errorList}</ul>`);
  }

  /**
   * Update progress indicator
   */
  updateProgress() {
    // Update step indicators
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      const stepNumber = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNumber === this.currentStep) {
        step.classList.add('active');
      } else if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      }
    });

    // Update progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      const progress = (this.currentStep / this.totalSteps) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  /**
   * Update step content
   */
  updateStepContent() {
    // Hide all step content
    document.querySelectorAll('.step-content').forEach(content => {
      content.classList.remove('active');
    });

    // Show current step content
    const currentContent = document.getElementById(`content-${this.currentStep}`);
    if (currentContent) {
      currentContent.classList.add('active');
    }

    // Update navigation buttons
    this.updateNavigationButtons();
  }

  /**
   * Update navigation buttons
   */
  updateNavigationButtons() {
    const prevBtn = document.querySelector('.btn-prev');
    const nextBtn = document.querySelector('.btn-next');
    
    if (prevBtn) {
      prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
    }
    
    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.textContent = 'Complete Setup';
        nextBtn.classList.remove('btn-primary');
        nextBtn.classList.add('btn-success');
      } else {
        nextBtn.textContent = 'Next';
        nextBtn.classList.remove('btn-success');
        nextBtn.classList.add('btn-primary');
      }
    }
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = this.getFormData();
    const schema = this.validation.getOnboardingValidationSchema();
    const validation = this.validation.validateForm(formData, schema);
    
    if (!validation.isValid) {
      this.showValidationErrors(validation.errors);
      return;
    }

    try {
      this.showLoading('Saving your profile...');
      
      // Save profile data
      await this.storage.storeProfile(formData);
      
      this.hideLoading();
      this.showSuccess('Profile saved successfully!');
      
      // Complete onboarding
      this.completeOnboarding();
      
    } catch (error) {
      console.error('Failed to save profile:', error);
      this.hideLoading();
      this.showError('Failed to save profile. Please try again.');
    }
  }

  /**
   * Complete onboarding
   */
  completeOnboarding() {
    // Show completion screen
    this.currentStep = this.totalSteps;
    this.updateProgress();
    this.updateStepContent();
    
    // Calculate profile score
    const score = this.calculateProfileScore();
    this.updateProfileScore(score);
  }

  /**
   * Calculate profile score
   * @returns {number} Profile score (0-100)
   */
  calculateProfileScore() {
    const formData = this.getFormData();
    let score = 0;
    
    // Basic information (20 points)
    if (formData.firstName && formData.lastName) score += 10;
    if (formData.email) score += 5;
    if (formData.phone) score += 5;
    
    // Professional information (30 points)
    if (formData.headline) score += 10;
    if (formData.summary && formData.summary.length > 100) score += 10;
    if (formData.location) score += 5;
    if (formData.linkedin) score += 5;
    
    // Skills (25 points)
    if (formData.skills && formData.skills.length >= 3) score += 15;
    if (formData.skills && formData.skills.length >= 5) score += 10;
    
    // Experience (25 points)
    if (formData.experience && formData.experience.length >= 1) score += 15;
    if (formData.experience && formData.experience.length >= 2) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Update profile score display
   * @param {number} score - Profile score
   */
  updateProfileScore(score) {
    const scoreElement = document.querySelector('.profile-score');
    if (scoreElement) {
      scoreElement.textContent = `${score}% Complete`;
    }
  }

  /**
   * Show loading state
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    loading.innerHTML = `
      <div class="loading-spinner"></div>
      <p>${message}</p>
    `;
    loading.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: white;
      font-family: var(--font-primary);
    `;
    
    document.body.appendChild(loading);
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    const loading = document.querySelector('.loading-overlay');
    if (loading) {
      loading.remove();
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   * @param {string} message - Message to show
   * @param {string} type - Notification type
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 8px;
      color: white;
      font-family: var(--font-primary);
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--error-red)' : 'var(--primary-blue)'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.jobCopilotApp = new JobCopilotApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JobCopilotApp };
}
