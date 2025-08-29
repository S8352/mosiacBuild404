// Extension Configuration
class ExtensionConfig {
  constructor() {
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const config = await chrome.storage.local.get('config');
      this.config = config.config || this.getDefaultConfig();
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        endpoints: {
          parseCV: '/api/parse-cv',
          generateDocuments: '/api/generate-documents',
          analyzeJob: '/api/analyze-job',
          saveQuestionAnswer: '/api/save-question-answer',
          getStoredAnswer: '/api/get-stored-answer',
          trackApplication: '/api/track-application'
        }
      },
      features: {
        autoDetectJobs: true,
        autoFillEnabled: true,
        notificationsEnabled: true,
        learningEnabled: true
      },
      storage: {
        useLocalStorage: true,
        syncToCloud: false
      },
      ui: {
        theme: 'light',
        language: 'en'
      }
    };
  }

  getApiUrl(endpoint) {
    return `${this.config.api.baseUrl}${this.config.api.endpoints[endpoint]}`;
  }

  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await chrome.storage.local.set({ config: this.config });
  }

  getApiBaseUrl() {
    return this.config.api.baseUrl;
  }
}

// Export for use in other modules
window.ExtensionConfig = ExtensionConfig;
