// Job Copilot Browser Assistant - Background Service Worker
class JobCopilotBackground {
  constructor() {
    this.init();
  }

  init() {
    this.setupInstallListener();
    this.setupMessageListener();
    this.setupTabUpdateListener();
    this.setupContextMenus();
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.showWelcomeNotification();
        this.initializeStorage();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });
  }

  async showWelcomeNotification() {
    try {
      await chrome.notifications.create('welcome', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Job Copilot Installed!',
        message: 'Click the extension icon to set up your profile and start applying to jobs smarter.'
      });
    } catch (error) {
      console.error('Error showing welcome notification:', error);
    }
  }

  async initializeStorage() {
    try {
      const defaultData = {
        profileData: {},
        applications: [],
        settings: {
          autoDetectJobs: true,
          autoFillEnabled: true,
          notificationsEnabled: true
        },
        questionAnswers: [] // For learning loop
      };

      await chrome.storage.local.set(defaultData);
      console.log('Storage initialized with default data');
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  handleUpdate(previousVersion) {
    console.log(`Updated from version ${previousVersion}`);
    // Handle any migration logic here
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'generateDocuments':
          this.handleDocumentGeneration(request.data, sendResponse);
          return true; // Keep message channel open for async response

        case 'saveQuestionAnswer':
          this.saveQuestionAnswer(request.question, request.answer);
          sendResponse({ success: true });
          break;

        case 'getStoredAnswer':
          this.getStoredAnswer(request.question, sendResponse);
          return true;

        case 'trackApplication':
          this.trackApplication(request.applicationData);
          sendResponse({ success: true });
          break;

        case 'updateApplicationStatus':
          this.updateApplicationStatus(request.applicationId, request.status);
          sendResponse({ success: true });
          break;

        default:
          console.log('Unknown message action:', request.action);
      }
    });
  }

  setupTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab.url);
      }
    });
  }

  async handleTabUpdate(tabId, url) {
    if (url.includes('linkedin.com/jobs')) {
      try {
        // Inject content script if not already present
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      } catch (error) {
        // Content script might already be injected
        console.log('Content script injection skipped:', error.message);
      }
    }
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'jobCopilotQuickFill',
      title: 'Quick Fill with Job Copilot',
      contexts: ['editable'],
      documentUrlPatterns: ['https://www.linkedin.com/*']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'jobCopilotQuickFill') {
        this.handleQuickFill(tab.id);
      }
    });
  }

  async handleQuickFill(tabId) {
    try {
      const result = await chrome.storage.local.get(['profileData']);
      const profileData = result.profileData || {};

      chrome.tabs.sendMessage(tabId, {
        action: 'autofillForm',
        profileData: profileData
      });
    } catch (error) {
      console.error('Error handling quick fill:', error);
    }
  }

  async handleDocumentGeneration(data, sendResponse) {
    try {
      // This would call the backend microservice
      const response = await this.callDocumentService(data);
      sendResponse({ success: true, documents: response });
    } catch (error) {
      console.error('Error generating documents:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async callDocumentService(data) {
    // Placeholder for backend API call
    // In production, this would call AWS Fargate microservice
    const API_ENDPOINT = 'https://api.jobcopilot.com/generate-documents';
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          profileData: data.profileData,
          jobData: data.jobData,
          documentTypes: ['cv', 'coverLetter']
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document service call failed:', error);
      // Return mock data for MVP
      return this.getMockDocuments();
    }
  }

  getMockDocuments() {
    // Mock document generation for MVP testing
    return {
      cv: {
        url: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago=',
        filename: 'tailored-cv.pdf'
      },
      coverLetter: {
        url: 'data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwo+PgplbmRvYmoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0tpZHMgWzMgMCBSXQovQ291bnQgMQo+PgplbmRvYmoKMyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDIgMCBSCi9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCj4+CmVuZG9iago=',
        filename: 'cover-letter.pdf'
      }
    };
  }

  async getAuthToken() {
    // Placeholder for authentication
    // In production, this would handle user authentication
    return 'mock-jwt-token';
  }

  async saveQuestionAnswer(question, answer) {
    try {
      const result = await chrome.storage.local.get(['questionAnswers']);
      const questionAnswers = result.questionAnswers || [];

      // Create semantic embedding for the question (simplified for MVP)
      const questionEntry = {
        id: Date.now().toString(),
        question: question.toLowerCase().trim(),
        answer: answer,
        createdAt: new Date().toISOString(),
        usageCount: 1
      };

      // Check if similar question already exists
      const existingIndex = questionAnswers.findIndex(qa => 
        this.calculateSimilarity(qa.question, question.toLowerCase().trim()) > 0.8
      );

      if (existingIndex >= 0) {
        // Update existing answer
        questionAnswers[existingIndex].answer = answer;
        questionAnswers[existingIndex].usageCount++;
        questionAnswers[existingIndex].updatedAt = new Date().toISOString();
      } else {
        // Add new question-answer pair
        questionAnswers.push(questionEntry);
      }

      await chrome.storage.local.set({ questionAnswers });
      console.log('Question-answer saved:', questionEntry);
    } catch (error) {
      console.error('Error saving question-answer:', error);
    }
  }

  async getStoredAnswer(question, sendResponse) {
    try {
      const result = await chrome.storage.local.get(['questionAnswers']);
      const questionAnswers = result.questionAnswers || [];

      // Find the most similar question
      let bestMatch = null;
      let bestSimilarity = 0;

      questionAnswers.forEach(qa => {
        const similarity = this.calculateSimilarity(qa.question, question.toLowerCase().trim());
        if (similarity > bestSimilarity && similarity > 0.7) { // 70% similarity threshold
          bestSimilarity = similarity;
          bestMatch = qa;
        }
      });

      if (bestMatch) {
        // Increment usage count
        bestMatch.usageCount++;
        await chrome.storage.local.set({ questionAnswers });
        
        sendResponse({ 
          found: true, 
          answer: bestMatch.answer,
          similarity: bestSimilarity
        });
      } else {
        sendResponse({ found: false });
      }
    } catch (error) {
      console.error('Error getting stored answer:', error);
      sendResponse({ found: false, error: error.message });
    }
  }

  calculateSimilarity(str1, str2) {
    // Simple similarity calculation using Jaccard similarity
    const set1 = new Set(str1.split(' '));
    const set2 = new Set(str2.split(' '));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  async trackApplication(applicationData) {
    try {
      const result = await chrome.storage.local.get(['applications']);
      const applications = result.applications || [];

      const application = {
        id: Date.now().toString(),
        ...applicationData,
        dateApplied: new Date().toISOString(),
        status: 'applied'
      };

      applications.unshift(application);
      await chrome.storage.local.set({ applications });

      // Show notification
      if (await this.getNotificationSetting()) {
        chrome.notifications.create(`app-${application.id}`, {
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Application Tracked',
          message: `Applied to ${application.jobTitle} at ${application.company}`
        });
      }

      console.log('Application tracked:', application);
    } catch (error) {
      console.error('Error tracking application:', error);
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const result = await chrome.storage.local.get(['applications']);
      const applications = result.applications || [];

      const applicationIndex = applications.findIndex(app => app.id === applicationId);
      if (applicationIndex >= 0) {
        applications[applicationIndex].status = status;
        applications[applicationIndex].updatedAt = new Date().toISOString();
        
        await chrome.storage.local.set({ applications });
        console.log('Application status updated:', applications[applicationIndex]);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }

  async getNotificationSetting() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      return result.settings?.notificationsEnabled ?? true;
    } catch (error) {
      console.error('Error getting notification setting:', error);
      return true;
    }
  }
}

// Initialize background service
new JobCopilotBackground();
