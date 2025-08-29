// Job Copilot - Injected Script for LinkedIn Job Pages
// This script runs in the page context and can access page variables

(function() {
  'use strict';

  // Job Copilot injected script
  console.log('Job Copilot: Injected script loaded');

  // Function to extract job data from page context
  window.jobCopilotExtract = function() {
    try {
      // Try to access LinkedIn's internal job data if available
      if (window.LI && window.LI.jobs && window.LI.jobs.jobDetails) {
        return window.LI.jobs.jobDetails;
      }

      // Fallback to DOM scraping
      return {
        title: document.querySelector('h1')?.textContent?.trim(),
        company: document.querySelector('[data-test-id="job-details-company-name"]')?.textContent?.trim(),
        location: document.querySelector('[data-test-id="job-details-location"]')?.textContent?.trim(),
        description: document.querySelector('.jobs-description__content')?.textContent?.trim()
      };
    } catch (error) {
      console.error('Job Copilot: Error extracting job data:', error);
      return null;
    }
  };

  // Function to fill form fields
  window.jobCopilotFillForm = function(data) {
    try {
      const fields = {
        'input[name*="firstName"]': data.firstName,
        'input[name*="lastName"]': data.lastName,
        'input[type="email"]': data.email,
        'input[type="tel"]': data.phone,
        'input[name*="location"]': data.location
      };

      Object.entries(fields).forEach(([selector, value]) => {
        if (value) {
          const element = document.querySelector(selector);
          if (element) {
            element.value = value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Job Copilot: Error filling form:', error);
      return false;
    }
  };

  // Listen for messages from content script
  window.addEventListener('message', function(event) {
    if (event.source !== window) return;
    if (event.data.type !== 'JOB_COPILOT') return;

    switch (event.data.action) {
      case 'EXTRACT_JOB_DATA':
        const jobData = window.jobCopilotExtract();
        window.postMessage({
          type: 'JOB_COPILOT_RESPONSE',
          action: 'JOB_DATA_EXTRACTED',
          data: jobData
        }, '*');
        break;

      case 'FILL_FORM':
        const success = window.jobCopilotFillForm(event.data.data);
        window.postMessage({
          type: 'JOB_COPILOT_RESPONSE',
          action: 'FORM_FILLED',
          success: success
        }, '*');
        break;
    }
  });

  console.log('Job Copilot: Injected script ready');
})();
