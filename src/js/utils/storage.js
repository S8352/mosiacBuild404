// Job Copilot - Storage Utilities
class StorageManager {
  constructor() {
    this.isExtension = typeof chrome !== 'undefined' && chrome.storage;
  }

  /**
   * Get data from storage
   * @param {string|string[]} keys - Key(s) to retrieve
   * @returns {Promise<any>} Retrieved data
   */
  async get(keys) {
    try {
      if (this.isExtension) {
        return await chrome.storage.local.get(keys);
      } else {
        // Fallback to localStorage for demo/testing
        if (Array.isArray(keys)) {
          const result = {};
          keys.forEach(key => {
            const item = localStorage.getItem(key);
            result[key] = item ? JSON.parse(item) : undefined;
          });
          return result;
        } else {
          const item = localStorage.getItem(keys);
          return { [keys]: item ? JSON.parse(item) : undefined };
        }
      }
    } catch (error) {
      console.error('Storage get error:', error);
      return {};
    }
  }

  /**
   * Set data in storage
   * @param {Object} data - Data to store
   * @returns {Promise<void>}
   */
  async set(data) {
    try {
      if (this.isExtension) {
        await chrome.storage.local.set(data);
      } else {
        // Fallback to localStorage
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
      }
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  }

  /**
   * Remove data from storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  async remove(keys) {
    try {
      if (this.isExtension) {
        await chrome.storage.local.remove(keys);
      } else {
        // Fallback to localStorage
        if (Array.isArray(keys)) {
          keys.forEach(key => localStorage.removeItem(key));
        } else {
          localStorage.removeItem(keys);
        }
      }
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      if (this.isExtension) {
        await chrome.storage.local.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  /**
   * Get storage usage info
   * @returns {Promise<Object>} Storage usage information
   */
  async getUsage() {
    try {
      if (this.isExtension && chrome.storage.local.getBytesInUse) {
        const bytesUsed = await chrome.storage.local.getBytesInUse();
        return {
          bytesUsed,
          quota: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
          percentUsed: (bytesUsed / (chrome.storage.local.QUOTA_BYTES || 5242880)) * 100
        };
      } else {
        // Estimate localStorage usage
        let totalSize = 0;
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
          }
        }
        return {
          bytesUsed: totalSize,
          quota: 5242880, // 5MB estimate
          percentUsed: (totalSize / 5242880) * 100
        };
      }
    } catch (error) {
      console.error('Storage usage error:', error);
      return { bytesUsed: 0, quota: 5242880, percentUsed: 0 };
    }
  }

  /**
   * Watch for storage changes
   * @param {Function} callback - Callback function for changes
   */
  onChanged(callback) {
    if (this.isExtension && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(callback);
    } else {
      // Fallback using storage event for localStorage
      window.addEventListener('storage', (event) => {
        callback({
          [event.key]: {
            oldValue: event.oldValue ? JSON.parse(event.oldValue) : undefined,
            newValue: event.newValue ? JSON.parse(event.newValue) : undefined
          }
        }, 'local');
      });
    }
  }

  /**
   * Encrypt data before storage (basic implementation)
   * @param {any} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  encrypt(data) {
    try {
      // Basic encryption using btoa (in production, use proper encryption)
      return btoa(JSON.stringify(data));
    } catch (error) {
      console.error('Encryption error:', error);
      return JSON.stringify(data);
    }
  }

  /**
   * Decrypt data after retrieval (basic implementation)
   * @param {string} encryptedData - Encrypted data
   * @returns {any} Decrypted data
   */
  decrypt(encryptedData) {
    try {
      // Basic decryption using atob (in production, use proper decryption)
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.error('Decryption error:', error);
      try {
        return JSON.parse(encryptedData);
      } catch (parseError) {
        return encryptedData;
      }
    }
  }

  /**
   * Store encrypted data
   * @param {string} key - Storage key
   * @param {any} data - Data to encrypt and store
   * @returns {Promise<void>}
   */
  async setEncrypted(key, data) {
    const encryptedData = this.encrypt(data);
    await this.set({ [key]: encryptedData });
  }

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @returns {Promise<any>} Decrypted data
   */
  async getDecrypted(key) {
    const result = await this.get(key);
    const encryptedData = result[key];
    return encryptedData ? this.decrypt(encryptedData) : undefined;
  }

  /**
   * Store profile data with encryption
   * @param {Object} profileData - User profile data
   * @returns {Promise<void>}
   */
  async storeProfile(profileData) {
    const profileWithTimestamp = {
      ...profileData,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };
    await this.setEncrypted('jobCopilotProfile', profileWithTimestamp);
  }

  /**
   * Retrieve profile data
   * @returns {Promise<Object|null>} User profile data
   */
  async getProfile() {
    return await this.getDecrypted('jobCopilotProfile');
  }

  /**
   * Store application data
   * @param {Array} applications - Application history
   * @returns {Promise<void>}
   */
  async storeApplications(applications) {
    await this.set({ jobCopilotApplications: applications });
  }

  /**
   * Get application data
   * @returns {Promise<Array>} Application history
   */
  async getApplications() {
    const result = await this.get('jobCopilotApplications');
    return result.jobCopilotApplications || [];
  }

  /**
   * Store settings
   * @param {Object} settings - User settings
   * @returns {Promise<void>}
   */
  async storeSettings(settings) {
    const defaultSettings = {
      autoDetectJobs: true,
      autoFillEnabled: true,
      notificationsEnabled: true,
      voiceInputEnabled: true,
      darkMode: false,
      language: 'en'
    };
    const mergedSettings = { ...defaultSettings, ...settings };
    await this.set({ jobCopilotSettings: mergedSettings });
  }

  /**
   * Get settings
   * @returns {Promise<Object>} User settings
   */
  async getSettings() {
    const result = await this.get('jobCopilotSettings');
    return result.jobCopilotSettings || {
      autoDetectJobs: true,
      autoFillEnabled: true,
      notificationsEnabled: true,
      voiceInputEnabled: true,
      darkMode: false,
      language: 'en'
    };
  }

  /**
   * Store learned answers for adaptive learning
   * @param {Array} answers - Learned question-answer pairs
   * @returns {Promise<void>}
   */
  async storeLearnedAnswers(answers) {
    await this.set({ jobCopilotLearnedAnswers: answers });
  }

  /**
   * Get learned answers
   * @returns {Promise<Array>} Learned question-answer pairs
   */
  async getLearnedAnswers() {
    const result = await this.get('jobCopilotLearnedAnswers');
    return result.jobCopilotLearnedAnswers || [];
  }

  /**
   * Export all data for backup
   * @returns {Promise<Object>} All stored data
   */
  async exportData() {
    try {
      const keys = [
        'jobCopilotProfile',
        'jobCopilotApplications',
        'jobCopilotSettings',
        'jobCopilotLearnedAnswers'
      ];
      const data = await this.get(keys);
      
      // Decrypt profile if encrypted
      if (data.jobCopilotProfile) {
        try {
          data.jobCopilotProfile = this.decrypt(data.jobCopilotProfile);
        } catch (error) {
          // Data might not be encrypted
        }
      }
      
      return {
        ...data,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Export data error:', error);
      throw error;
    }
  }

  /**
   * Import data from backup
   * @param {Object} data - Data to import
   * @returns {Promise<void>}
   */
  async importData(data) {
    try {
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }

      // Import each data type
      if (data.jobCopilotProfile) {
        await this.storeProfile(data.jobCopilotProfile);
      }
      
      if (data.jobCopilotApplications) {
        await this.storeApplications(data.jobCopilotApplications);
      }
      
      if (data.jobCopilotSettings) {
        await this.storeSettings(data.jobCopilotSettings);
      }
      
      if (data.jobCopilotLearnedAnswers) {
        await this.storeLearnedAnswers(data.jobCopilotLearnedAnswers);
      }
    } catch (error) {
      console.error('Import data error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const storageManager = new StorageManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, storageManager };
} else if (typeof window !== 'undefined') {
  window.StorageManager = StorageManager;
  window.storageManager = storageManager;
}
