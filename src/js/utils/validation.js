// Job Copilot - Form Validation Utilities
class ValidationManager {
  constructor() {
    this.validators = new Map();
    this.errorMessages = new Map();
    this.customValidators = new Map();
    
    this.initDefaultValidators();
  }

  /**
   * Initialize default validators
   */
  initDefaultValidators() {
    // Email validation
    this.addValidator('email', (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }, 'Please enter a valid email address');

    // Phone validation
    this.addValidator('phone', (value) => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/\D/g, ''));
    }, 'Please enter a valid phone number');

    // Required field validation
    this.addValidator('required', (value) => {
      return value !== null && value !== undefined && value.toString().trim() !== '';
    }, 'This field is required');

    // URL validation
    this.addValidator('url', (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, 'Please enter a valid URL');

    // Minimum length validation
    this.addValidator('minLength', (value, min) => {
      return value && value.toString().length >= min;
    }, (min) => `Must be at least ${min} characters long`);

    // Maximum length validation
    this.addValidator('maxLength', (value, max) => {
      return value && value.toString().length <= max;
    }, (max) => `Must be no more than ${max} characters long`);

    // Number validation
    this.addValidator('number', (value) => {
      return !isNaN(value) && !isNaN(parseFloat(value));
    }, 'Please enter a valid number');

    // Date validation
    this.addValidator('date', (value) => {
      const date = new Date(value);
      return date instanceof Date && !isNaN(date);
    }, 'Please enter a valid date');

    // Future date validation
    this.addValidator('futureDate', (value) => {
      const date = new Date(value);
      const today = new Date();
      return date instanceof Date && !isNaN(date) && date > today;
    }, 'Please enter a future date');

    // Past date validation
    this.addValidator('pastDate', (value) => {
      const date = new Date(value);
      const today = new Date();
      return date instanceof Date && !isNaN(date) && date < today;
    }, 'Please enter a past date');

    // Skills validation
    this.addValidator('skills', (value) => {
      if (!Array.isArray(value)) return false;
      return value.length > 0 && value.every(skill => skill.trim() !== '');
    }, 'Please add at least one skill');

    // Experience validation
    this.addValidator('experience', (value) => {
      if (!Array.isArray(value)) return false;
      return value.length > 0 && value.every(exp => 
        exp.jobTitle && exp.company && exp.startDate
      );
    }, 'Please add at least one work experience');

    // LinkedIn URL validation
    this.addValidator('linkedin', (value) => {
      if (!value) return true; // Optional field
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      return linkedinRegex.test(value);
    }, 'Please enter a valid LinkedIn URL');

    // Name validation
    this.addValidator('name', (value) => {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      return nameRegex.test(value);
    }, 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only)');

    // Professional summary validation
    this.addValidator('summary', (value) => {
      return value && value.toString().trim().length >= 50;
    }, 'Professional summary must be at least 50 characters long');
  }

  /**
   * Add a custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validation function
   * @param {string|Function} errorMessage - Error message or function
   */
  addValidator(name, validator, errorMessage) {
    this.validators.set(name, validator);
    this.errorMessages.set(name, errorMessage);
  }

  /**
   * Add a custom validator with custom error message function
   * @param {string} name - Validator name
   * @param {Function} validator - Validation function
   * @param {Function} errorMessageFn - Error message function
   */
  addCustomValidator(name, validator, errorMessageFn) {
    this.customValidators.set(name, { validator, errorMessageFn });
  }

  /**
   * Validate a single field
   * @param {string} value - Field value
   * @param {string|Array} rules - Validation rules
   * @param {Object} options - Additional options
   * @returns {Object} Validation result
   */
  validateField(value, rules, options = {}) {
    const errors = [];
    const ruleArray = Array.isArray(rules) ? rules : [rules];

    for (const rule of ruleArray) {
      const validationResult = this.validateRule(value, rule, options);
      if (!validationResult.isValid) {
        errors.push(validationResult.error);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0] || null
    };
  }

  /**
   * Validate a single rule
   * @param {string} value - Field value
   * @param {string|Object} rule - Validation rule
   * @param {Object} options - Additional options
   * @returns {Object} Validation result
   */
  validateRule(value, rule, options = {}) {
    let ruleName, ruleParams;

    if (typeof rule === 'string') {
      ruleName = rule;
      ruleParams = [];
    } else if (typeof rule === 'object') {
      ruleName = rule.name;
      ruleParams = rule.params || [];
    } else {
      return { isValid: false, error: 'Invalid validation rule' };
    }

    // Check custom validators first
    if (this.customValidators.has(ruleName)) {
      const customValidator = this.customValidators.get(ruleName);
      const isValid = customValidator.validator(value, ...ruleParams, options);
      const error = isValid ? null : customValidator.errorMessageFn(value, ...ruleParams, options);
      return { isValid, error };
    }

    // Check default validators
    if (this.validators.has(ruleName)) {
      const validator = this.validators.get(ruleName);
      const isValid = validator(value, ...ruleParams);
      
      let error = null;
      if (!isValid) {
        const errorMessage = this.errorMessages.get(ruleName);
        if (typeof errorMessage === 'function') {
          error = errorMessage(...ruleParams);
        } else {
          error = errorMessage;
        }
      }

      return { isValid, error };
    }

    return { isValid: false, error: `Unknown validation rule: ${ruleName}` };
  }

  /**
   * Validate an entire form
   * @param {Object} formData - Form data object
   * @param {Object} validationSchema - Validation schema
   * @returns {Object} Validation results
   */
  validateForm(formData, validationSchema) {
    const results = {
      isValid: true,
      errors: {},
      fieldResults: {}
    };

    for (const [fieldName, rules] of Object.entries(validationSchema)) {
      const value = formData[fieldName];
      const fieldResult = this.validateField(value, rules);
      
      results.fieldResults[fieldName] = fieldResult;
      
      if (!fieldResult.isValid) {
        results.isValid = false;
        results.errors[fieldName] = fieldResult.errors;
      }
    }

    return results;
  }

  /**
   * Validate form in real-time
   * @param {HTMLElement} form - Form element
   * @param {Object} validationSchema - Validation schema
   */
  validateFormRealTime(form, validationSchema) {
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      const fieldName = field.name || field.id;
      if (!fieldName || !validationSchema[fieldName]) return;

      const validateField = () => {
        const value = field.value;
        const result = this.validateField(value, validationSchema[fieldName]);
        this.updateFieldValidation(field, result);
      };

      // Validate on input
      field.addEventListener('input', validateField);
      
      // Validate on blur
      field.addEventListener('blur', validateField);
      
      // Validate on change (for select elements)
      field.addEventListener('change', validateField);
    });
  }

  /**
   * Update field validation UI
   * @param {HTMLElement} field - Field element
   * @param {Object} result - Validation result
   */
  updateFieldValidation(field, result) {
    // Remove existing validation classes
    field.classList.remove('valid', 'invalid');
    
    // Remove existing error messages
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    if (result.isValid) {
      field.classList.add('valid');
    } else {
      field.classList.add('invalid');
      
      // Add error message
      const errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.textContent = result.firstError;
      
      const wrapper = field.closest('.form-group') || field.parentNode;
      wrapper.appendChild(errorElement);
    }
  }

  /**
   * Get validation schema for onboarding form
   * @returns {Object} Validation schema
   */
  getOnboardingValidationSchema() {
    return {
      firstName: ['required', 'name'],
      lastName: ['required', 'name'],
      email: ['required', 'email'],
      phone: ['required', 'phone'],
      location: ['required'],
      linkedin: ['linkedin'],
      headline: ['required', { name: 'minLength', params: [10] }],
      summary: ['required', 'summary'],
      skills: ['skills'],
      experience: ['experience']
    };
  }

  /**
   * Get validation schema for job application form
   * @returns {Object} Validation schema
   */
  getJobApplicationValidationSchema() {
    return {
      jobTitle: ['required'],
      company: ['required'],
      startDate: ['required', 'date'],
      endDate: ['date'],
      achievements: ['required', { name: 'minLength', params: [20] }]
    };
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile(file, options = {}) {
    const errors = [];
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['.pdf', '.docx', '.doc'],
      maxFiles = 1
    } = options;

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${this.formatFileSize(maxSize)}`);
    }

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0] || null
    };
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate date range
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @param {boolean} allowFuture - Allow future dates
   * @returns {Object} Validation result
   */
  validateDateRange(startDate, endDate, allowFuture = false) {
    const errors = [];
    
    if (!startDate) {
      errors.push('Start date is required');
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        errors.push('End date must be after start date');
      }
      
      if (!allowFuture && end > new Date()) {
        errors.push('End date cannot be in the future');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0] || null
    };
  }

  /**
   * Validate skills input
   * @param {Array} skills - Skills array
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateSkills(skills, options = {}) {
    const {
      minSkills = 1,
      maxSkills = 20,
      minSkillLength = 2,
      maxSkillLength = 50
    } = options;

    const errors = [];

    if (!Array.isArray(skills)) {
      errors.push('Skills must be an array');
      return { isValid: false, errors, firstError: errors[0] };
    }

    if (skills.length < minSkills) {
      errors.push(`Please add at least ${minSkills} skill${minSkills > 1 ? 's' : ''}`);
    }

    if (skills.length > maxSkills) {
      errors.push(`Please limit to ${maxSkills} skills or fewer`);
    }

    skills.forEach((skill, index) => {
      if (skill.length < minSkillLength) {
        errors.push(`Skill ${index + 1} must be at least ${minSkillLength} characters`);
      }
      
      if (skill.length > maxSkillLength) {
        errors.push(`Skill ${index + 1} must be no more than ${maxSkillLength} characters`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      firstError: errors[0] || null
    };
  }

  /**
   * Clear all validation errors from a form
   * @param {HTMLElement} form - Form element
   */
  clearValidationErrors(form) {
    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(error => error.remove());
    
    const fields = form.querySelectorAll('input, textarea, select');
    fields.forEach(field => {
      field.classList.remove('valid', 'invalid');
    });
  }

  /**
   * Show validation summary
   * @param {Object} validationResults - Validation results
   * @param {HTMLElement} container - Container to show summary in
   */
  showValidationSummary(validationResults, container) {
    if (validationResults.isValid) {
      container.innerHTML = '<div class="success-message">✓ All fields are valid</div>';
    } else {
      const errorList = Object.entries(validationResults.errors)
        .map(([field, errors]) => `<li><strong>${field}:</strong> ${errors.join(', ')}</li>`)
        .join('');
      
      container.innerHTML = `
        <div class="error-message">
          <strong>Please fix the following errors:</strong>
          <ul>${errorList}</ul>
        </div>
      `;
    }
  }
}

// Create singleton instance
const validationManager = new ValidationManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ValidationManager, validationManager };
} else if (typeof window !== 'undefined') {
  window.ValidationManager = ValidationManager;
  window.validationManager = validationManager;
}
