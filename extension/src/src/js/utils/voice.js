// Job Copilot - Voice Input Utilities
class VoiceManager {
  constructor() {
    this.recognition = null;
    this.synthesis = null;
    this.isRecording = false;
    this.currentTarget = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    this.onEndCallback = null;
    
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }

  /**
   * Initialize speech recognition
   */
  initSpeechRecognition() {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        
        this.recognition.onstart = () => {
          this.isRecording = true;
          this.updateUI();
        };
        
        this.recognition.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result.transcript)
            .join('');
          
          if (this.onResultCallback) {
            this.onResultCallback(transcript, event.results[event.results.length - 1].isFinal);
          }
        };
        
        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          this.isRecording = false;
          this.updateUI();
          
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
        };
        
        this.recognition.onend = () => {
          this.isRecording = false;
          this.updateUI();
          
          if (this.onEndCallback) {
            this.onEndCallback();
          }
        };
      }
    } catch (error) {
      console.error('Speech recognition initialization error:', error);
    }
  }

  /**
   * Initialize speech synthesis
   */
  initSpeechSynthesis() {
    try {
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
      }
    } catch (error) {
      console.error('Speech synthesis initialization error:', error);
    }
  }

  /**
   * Start voice recording
   * @param {HTMLElement} target - Target input element
   * @param {Function} onResult - Callback for results
   * @param {Function} onError - Callback for errors
   * @param {Function} onEnd - Callback when recording ends
   */
  startRecording(target, onResult, onError, onEnd) {
    if (!this.recognition) {
      this.showError('Speech recognition not supported in this browser');
      return false;
    }

    if (this.isRecording) {
      this.stopRecording();
    }

    this.currentTarget = target;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onEndCallback = onEnd;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.showError('Failed to start voice recording');
      return false;
    }
  }

  /**
   * Stop voice recording
   */
  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
  }

  /**
   * Update UI elements to reflect recording state
   */
  updateUI() {
    const voiceButtons = document.querySelectorAll('.voice-button');
    voiceButtons.forEach(button => {
      if (this.isRecording && button.dataset.target === this.currentTarget?.id) {
        button.classList.add('recording');
        button.textContent = '⏹️';
      } else {
        button.classList.remove('recording');
        button.textContent = '🎤';
      }
    });

    // Update voice panel if it exists
    const voicePanel = document.getElementById('voice-assistant-panel');
    if (voicePanel) {
      if (this.isRecording) {
        voicePanel.classList.add('active');
        this.updateVoicePanel();
      } else {
        voicePanel.classList.remove('active');
      }
    }
  }

  /**
   * Update voice panel content
   */
  updateVoicePanel() {
    const transcriptElement = document.getElementById('voice-transcript');
    const waveElement = document.getElementById('voice-wave');
    
    if (transcriptElement) {
      transcriptElement.textContent = this.isRecording ? 'Listening...' : '';
    }
    
    if (waveElement) {
      waveElement.style.display = this.isRecording ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.error('Voice input error:', message);
    
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.className = 'voice-error-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      font-family: var(--font-primary);
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Speak text using speech synthesis
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   */
  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';

    // Get available voices
    const voices = this.synthesis.getVoices();
    if (voices.length > 0) {
      // Prefer a female voice for better user experience
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('Speech started');
    };

    utterance.onend = () => {
      console.log('Speech ended');
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Get available voices
   * @returns {Array} Available voices
   */
  getVoices() {
    if (!this.synthesis) {
      return [];
    }
    return this.synthesis.getVoices();
  }

  /**
   * Check if voice input is supported
   * @returns {boolean} Support status
   */
  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check if speech synthesis is supported
   * @returns {boolean} Support status
   */
  isSynthesisSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * Request microphone permission
   * @returns {Promise<boolean>} Permission status
   */
  async requestPermission() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }

  /**
   * Process voice input for specific field types
   * @param {string} transcript - Voice transcript
   * @param {string} fieldType - Type of field (name, email, phone, etc.)
   * @returns {string} Processed text
   */
  processTranscript(transcript, fieldType) {
    let processed = transcript.trim();
    
    switch (fieldType) {
      case 'name':
        // Capitalize first letter of each word
        processed = processed.replace(/\b\w/g, l => l.toUpperCase());
        break;
        
      case 'email':
        // Handle common email phrases
        processed = processed
          .replace(/\s+at\s+/g, '@')
          .replace(/\s+dot\s+/g, '.')
          .replace(/\s+/g, '');
        break;
        
      case 'phone':
        // Format phone numbers
        processed = processed
          .replace(/\D/g, '') // Remove non-digits
          .replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3'); // Format as (XXX) XXX-XXXX
        break;
        
      case 'date':
        // Handle date formats
        processed = processed
          .replace(/\bjanuary\b/gi, '01')
          .replace(/\bfebruary\b/gi, '02')
          .replace(/\bmarch\b/gi, '03')
          .replace(/\bapril\b/gi, '04')
          .replace(/\bmay\b/gi, '05')
          .replace(/\bjune\b/gi, '06')
          .replace(/\bjuly\b/gi, '07')
          .replace(/\baugust\b/gi, '08')
          .replace(/\bseptember\b/gi, '09')
          .replace(/\boctober\b/gi, '10')
          .replace(/\bnovember\b/gi, '11')
          .replace(/\bdecember\b/gi, '12');
        break;
        
      case 'number':
        // Extract numbers only
        processed = processed.replace(/\D/g, '');
        break;
        
      default:
        // Default processing - just trim
        break;
    }
    
    return processed;
  }

  /**
   * Create voice input button for an element
   * @param {HTMLElement} element - Target input element
   * @param {string} fieldType - Type of field for processing
   * @returns {HTMLElement} Voice button element
   */
  createVoiceButton(element, fieldType = 'text') {
    const button = document.createElement('button');
    button.className = 'voice-button';
    button.type = 'button';
    button.textContent = '🎤';
    button.dataset.target = element.id;
    button.dataset.fieldType = fieldType;
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleVoiceButtonClick(element, fieldType);
    });
    
    return button;
  }

  /**
   * Handle voice button click
   * @param {HTMLElement} element - Target element
   * @param {string} fieldType - Field type
   */
  handleVoiceButtonClick(element, fieldType) {
    if (this.isRecording) {
      this.stopRecording();
      return;
    }

    this.startRecording(
      element,
      (transcript, isFinal) => {
        if (isFinal) {
          const processed = this.processTranscript(transcript, fieldType);
          element.value = processed;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      },
      (error) => {
        this.showError(`Voice input error: ${error}`);
      },
      () => {
        // Recording ended
      }
    );
  }

  /**
   * Initialize voice input for all form fields
   */
  initVoiceInputs() {
    const voiceInputs = document.querySelectorAll('.voice-input-wrapper');
    
    voiceInputs.forEach(wrapper => {
      const input = wrapper.querySelector('input, textarea');
      const button = wrapper.querySelector('.voice-button');
      
      if (input && button) {
        const fieldType = button.dataset.fieldType || 'text';
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleVoiceButtonClick(input, fieldType);
        });
      }
    });
  }

  /**
   * Create voice assistant panel
   * @returns {HTMLElement} Voice panel element
   */
  createVoicePanel() {
    const panel = document.createElement('div');
    panel.id = 'voice-assistant-panel';
    panel.className = 'voice-assistant-panel';
    
    panel.innerHTML = `
      <div class="voice-panel-header">
        <h3>Voice Assistant</h3>
        <button class="voice-close-btn" onclick="this.parentElement.parentElement.classList.remove('active')">×</button>
      </div>
      <div class="voice-panel-content">
        <div id="voice-wave" class="voice-wave" style="display: none;">
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
        <div id="voice-transcript" class="transcript"></div>
        <div class="voice-suggestions">
          <div class="suggestion-chip" onclick="voiceManager.speak('My name is John Doe')">"My name is John Doe"</div>
          <div class="suggestion-chip" onclick="voiceManager.speak('I have 5 years of experience')">"I have 5 years of experience"</div>
          <div class="suggestion-chip" onclick="voiceManager.speak('I am proficient in JavaScript')">"I am proficient in JavaScript"</div>
        </div>
      </div>
    `;
    
    return panel;
  }

  /**
   * Initialize voice assistant
   */
  init() {
    if (!this.isSupported()) {
      console.warn('Speech recognition not supported');
      return false;
    }

    // Initialize voice inputs
    this.initVoiceInputs();
    
    // Create voice panel if it doesn't exist
    if (!document.getElementById('voice-assistant-panel')) {
      const panel = this.createVoicePanel();
      document.body.appendChild(panel);
    }
    
    return true;
  }
}

// Create singleton instance
const voiceManager = new VoiceManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceManager, voiceManager };
} else if (typeof window !== 'undefined') {
  window.VoiceManager = VoiceManager;
  window.voiceManager = voiceManager;
}
