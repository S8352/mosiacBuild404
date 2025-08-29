// Job Copilot Browser Assistant - Background Service Worker
import { ExtensionConfig } from './src/js/config.js';

class JobCopilotBackground {
  constructor() {
    this.config = new ExtensionConfig();
    this.init();
  }

  init() {
    try {
      this.setupInstallListener();
      this.setupMessageListener();
      this.setupTabUpdateListener();
      this.setupContextMenus();
    } catch (error) {
      console.error('Error initializing Job Copilot Background:', error);
    }
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
      if (chrome.notifications) {
        const iconDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
        await chrome.notifications.create('welcome', {
          type: 'basic',
          iconUrl: iconDataUrl,
          title: 'Job Copilot Installed!',
          message: 'Click the extension icon to set up your profile and start applying to jobs smarter.'
        });
      }
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

        case 'parseCV':
          this.handleCVParsing(request.data, sendResponse);
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

        case 'getProfileData':
          this.getProfileData(sendResponse);
          return true;

        case 'updateProfileData':
          this.updateProfileData(request.data);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }

  setupTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com/jobs')) {
        this.handleJobPageLoad(tabId, tab);
      }
    });
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: 'jobCopilotMenu',
      title: 'Job Copilot',
      contexts: ['page']
    });

    chrome.contextMenus.create({
      id: 'analyzeJob',
      parentId: 'jobCopilotMenu',
      title: 'Analyze Job Fit',
      contexts: ['page']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'analyzeJob') {
        this.analyzeJobFromContextMenu(tab);
      }
    });
  }

  async handleJobPageLoad(tabId, tab) {
    try {
      // Inject content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
    } catch (error) {
      console.error('Error injecting content script:', error);
    }
  }

  async analyzeJobFromContextMenu(tab) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'analyzeJobFromContext'
      });
      console.log('Job analysis response:', response);
    } catch (error) {
      console.error('Error analyzing job from context menu:', error);
    }
  }

  async handleCVParsing(data, sendResponse) {
    try {
      const apiUrl = this.config.getApiUrl('parseCV');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error('Error parsing CV:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleDocumentGeneration(data, sendResponse) {
    try {
      const apiUrl = this.config.getApiUrl('generateDocuments');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      sendResponse({ success: true, data: result });
    } catch (error) {
      console.error('Error generating documents:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async saveQuestionAnswer(question, answer) {
    try {
      // Store locally in IndexedDB
      const storage = await chrome.storage.local.get('questionAnswers');
      const questionAnswers = storage.questionAnswers || [];
      
      questionAnswers.push({
        id: Date.now().toString(),
        question: question,
        answer: answer,
        timestamp: new Date().toISOString()
      });

      await chrome.storage.local.set({ questionAnswers: questionAnswers });

      // Optionally sync to backend if enabled
      if (this.config.config.storage.syncToCloud) {
        const apiUrl = this.config.getApiUrl('saveQuestionAnswer');
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ question, answer })
        });
      }
    } catch (error) {
      console.error('Error saving question answer:', error);
    }
  }

  async getStoredAnswer(question, sendResponse) {
    try {
      const storage = await chrome.storage.local.get('questionAnswers');
      const questionAnswers = storage.questionAnswers || [];
      
      // Simple keyword matching for now
      const matchingAnswer = questionAnswers.find(qa => 
        qa.question.toLowerCase().includes(question.toLowerCase()) ||
        question.toLowerCase().includes(qa.question.toLowerCase())
      );

      sendResponse({ success: true, answer: matchingAnswer?.answer || null });
    } catch (error) {
      console.error('Error getting stored answer:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async trackApplication(applicationData) {
    try {
      const storage = await chrome.storage.local.get('applications');
      const applications = storage.applications || [];
      
      applications.push({
        id: Date.now().toString(),
        ...applicationData,
        timestamp: new Date().toISOString(),
        status: 'applied'
      });

      await chrome.storage.local.set({ applications: applications });

      // Sync to backend if enabled
      if (this.config.config.storage.syncToCloud) {
        const apiUrl = this.config.getApiUrl('trackApplication');
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(applicationData)
        });
      }
    } catch (error) {
      console.error('Error tracking application:', error);
    }
  }

  async updateApplicationStatus(applicationId, status) {
    try {
      const storage = await chrome.storage.local.get('applications');
      const applications = storage.applications || [];
      
      const appIndex = applications.findIndex(app => app.id === applicationId);
      if (appIndex !== -1) {
        applications[appIndex].status = status;
        applications[appIndex].updatedAt = new Date().toISOString();
        await chrome.storage.local.set({ applications: applications });
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }

  async getProfileData(sendResponse) {
    try {
      const storage = await chrome.storage.local.get('profileData');
      sendResponse({ success: true, data: storage.profileData || {} });
    } catch (error) {
      console.error('Error getting profile data:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async updateProfileData(data) {
    try {
      await chrome.storage.local.set({ profileData: data });
      console.log('Profile data updated successfully');
    } catch (error) {
      console.error('Error updating profile data:', error);
    }
  }
}

// Initialize the background service
new JobCopilotBackground();
