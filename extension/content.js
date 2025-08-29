// Job Copilot Browser Assistant - Content Script for LinkedIn
class LinkedInJobScraper {
  constructor() {
    this.currentJobData = null;
    this.isEasyApplyPage = false;
    this.init();
  }

  init() {
    this.detectJobPage();
    this.setupMessageListener();
    this.observePageChanges();
  }

  detectJobPage() {
    const url = window.location.href;
    this.isEasyApplyPage = url.includes('linkedin.com/jobs/view/') || 
                          url.includes('linkedin.com/jobs/collections/');
    
    if (this.isEasyApplyPage) {
      this.scrapeJobData();
    }
  }

  scrapeJobData() {
    try {
      const jobData = {
        url: window.location.href,
        title: this.extractJobTitle(),
        company: this.extractCompany(),
        location: this.extractLocation(),
        description: this.extractJobDescription(),
        requirements: this.extractRequirements(),
        skills: this.extractSkills(),
        seniority: this.extractSeniority(),
        employmentType: this.extractEmploymentType(),
        scrapedAt: new Date().toISOString()
      };

      this.currentJobData = jobData;
      console.log('Job data scraped:', jobData);
    } catch (error) {
      console.error('Error scraping job data:', error);
    }
  }

  extractJobTitle() {
    // Try multiple selectors for job title
    const selectors = [
      '.job-details-jobs-unified-top-card__job-title h1',
      '.jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      '.jobs-unified-top-card__job-title',
      'h1[data-test-id="job-title"]',
      '.job-details-jobs-unified-top-card__job-title a'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return 'Job Title Not Found';
  }

  extractCompany() {
    const selectors = [
      '.job-details-jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name',
      '[data-test-id="job-details-company-name"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    return 'Company Not Found';
  }

  extractLocation() {
    const selectors = [
      '.job-details-jobs-unified-top-card__primary-description-container .tvm__text',
      '.jobs-unified-top-card__bullet',
      '.job-details-jobs-unified-top-card__primary-description .tvm__text',
      '[data-test-id="job-details-location"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        const text = element.textContent.trim();
        // Filter out non-location text
        if (!text.includes('employees') && !text.includes('followers')) {
          return text;
        }
      }
    }

    return 'Location Not Found';
  }

  extractJobDescription() {
    const selectors = [
      '.job-details-jobs-unified-top-card__job-description',
      '.jobs-description__content',
      '.job-details-jobs-unified-top-card__job-description .tvm__text',
      '[data-test-id="job-details-description"]',
      '.jobs-box__html-content'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    // Try to get description from expanded view
    const showMoreButton = document.querySelector('.jobs-description__footer button');
    if (showMoreButton && showMoreButton.textContent.includes('Show more')) {
      showMoreButton.click();
      setTimeout(() => {
        const expandedDesc = document.querySelector('.jobs-description__content');
        if (expandedDesc) {
          return expandedDesc.textContent.trim();
        }
      }, 500);
    }

    return 'Job Description Not Found';
  }

  extractRequirements() {
    const description = this.extractJobDescription();
    const requirements = [];

    // Look for common requirement patterns
    const requirementPatterns = [
      /requirements?:?\s*(.+?)(?:\n\n|\n[A-Z]|$)/gi,
      /qualifications?:?\s*(.+?)(?:\n\n|\n[A-Z]|$)/gi,
      /must have:?\s*(.+?)(?:\n\n|\n[A-Z]|$)/gi,
      /required:?\s*(.+?)(?:\n\n|\n[A-Z]|$)/gi
    ];

    requirementPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        matches.forEach(match => {
          requirements.push(match.trim());
        });
      }
    });

    return requirements;
  }

  extractSkills() {
    const description = this.extractJobDescription().toLowerCase();
    const skills = [];

    // Common technical skills to look for
    const technicalSkills = [
      'javascript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'typescript',
      'html', 'css', 'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes',
      'git', 'agile', 'scrum', 'rest api', 'graphql', 'machine learning', 'ai', 'data science',
      'tensorflow', 'pytorch', 'pandas', 'numpy', 'excel', 'tableau', 'power bi', 'salesforce'
    ];

    // Soft skills to look for
    const softSkills = [
      'communication', 'leadership', 'teamwork', 'problem solving', 'analytical thinking',
      'project management', 'time management', 'adaptability', 'creativity', 'collaboration'
    ];

    const allSkills = [...technicalSkills, ...softSkills];

    allSkills.forEach(skill => {
      if (description.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });

    return [...new Set(skills)]; // Remove duplicates
  }

  extractSeniority() {
    const title = this.extractJobTitle().toLowerCase();
    const description = this.extractJobDescription().toLowerCase();
    const fullText = `${title} ${description}`;

    if (fullText.includes('senior') || fullText.includes('sr.') || fullText.includes('lead')) {
      return 'Senior';
    } else if (fullText.includes('junior') || fullText.includes('jr.') || fullText.includes('entry')) {
      return 'Junior';
    } else if (fullText.includes('mid') || fullText.includes('intermediate')) {
      return 'Mid-level';
    } else if (fullText.includes('principal') || fullText.includes('staff') || fullText.includes('architect')) {
      return 'Principal';
    }

    return 'Mid-level'; // Default
  }

  extractEmploymentType() {
    const description = this.extractJobDescription().toLowerCase();

    if (description.includes('full-time') || description.includes('full time')) {
      return 'Full-time';
    } else if (description.includes('part-time') || description.includes('part time')) {
      return 'Part-time';
    } else if (description.includes('contract') || description.includes('contractor')) {
      return 'Contract';
    } else if (description.includes('intern') || description.includes('internship')) {
      return 'Internship';
    }

    return 'Full-time'; // Default
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getJobData') {
        sendResponse({ jobData: this.currentJobData });
      } else if (request.action === 'autofillForm') {
        this.autofillForm(request.profileData);
        sendResponse({ success: true });
      }
    });
  }

  autofillForm(profileData) {
    try {
      // Common form field mappings
      const fieldMappings = {
        // Name fields
        'input[name*="firstName"], input[id*="firstName"], input[placeholder*="first name" i]': profileData.fullName?.split(' ')[0] || '',
        'input[name*="lastName"], input[id*="lastName"], input[placeholder*="last name" i]': profileData.fullName?.split(' ').slice(1).join(' ') || '',
        'input[name*="fullName"], input[id*="fullName"], input[name*="name"], input[placeholder*="full name" i]': profileData.fullName || '',
        
        // Contact fields
        'input[type="email"], input[name*="email"], input[id*="email"]': profileData.email || '',
        'input[type="tel"], input[name*="phone"], input[id*="phone"], input[name*="mobile"]': profileData.phone || '',
        
        // Location fields
        'input[name*="location"], input[id*="location"], input[name*="city"], input[name*="address"]': profileData.location || '',
        
        // Professional fields
        'input[name*="headline"], input[id*="headline"], input[name*="title"]': profileData.headline || '',
        'textarea[name*="summary"], textarea[id*="summary"], textarea[name*="about"]': profileData.summary || ''
      };

      // Apply autofill
      Object.entries(fieldMappings).forEach(([selector, value]) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && value) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      // Handle dropdowns and select elements
      this.handleDropdownFields(profileData);

      // Handle LinkedIn Easy Apply specific fields
      this.handleLinkedInEasyApplyFields(profileData);

      console.log('Form autofilled successfully');
    } catch (error) {
      console.error('Error autofilling form:', error);
    }
  }

  handleDropdownFields(profileData) {
    // Handle experience level dropdowns
    const experienceSelectors = [
      'select[name*="experience"]',
      'select[id*="experience"]',
      'select[name*="seniority"]'
    ];

    experienceSelectors.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        // Try to match based on profile data or job requirements
        const options = Array.from(element.options);
        const matchingOption = options.find(option => 
          option.text.toLowerCase().includes('senior') ||
          option.text.toLowerCase().includes('mid') ||
          option.text.toLowerCase().includes('junior')
        );
        
        if (matchingOption) {
          element.value = matchingOption.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }

  handleLinkedInEasyApplyFields(profileData) {
    // LinkedIn Easy Apply specific selectors
    const linkedInSelectors = {
      'input[id*="easyApplyFormElement"]': profileData.fullName,
      'input[data-test-text-entity-list-form-component="textInputFormComponent"]': profileData.email
    };

    Object.entries(linkedInSelectors).forEach(([selector, value]) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element && value && !element.value) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
  }

  observePageChanges() {
    // Watch for URL changes (SPA navigation)
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(() => {
          this.detectJobPage();
        }, 1000); // Wait for page to load
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        this.detectJobPage();
      }, 1000);
    });
  }
}

// Initialize the scraper when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LinkedInJobScraper();
  });
} else {
  new LinkedInJobScraper();
}
