import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor() {
    this.encryptionKey = this.generateEncryptionKey();
    this.sessionId = this.generateSessionId();
  }

  // Generate a unique encryption key for this session
  generateEncryptionKey() {
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    const random = Math.random().toString();
    return CryptoJS.SHA256(userAgent + timestamp + random).toString();
  }

  // Generate a unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Encrypt data before storing
  encrypt(data) {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  // Decrypt data after retrieving
  decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Store data securely (encrypted + session-based)
  setItem(key, value) {
    try {
      const encryptedValue = this.encrypt(value);
      if (encryptedValue) {
        // Store encrypted data in sessionStorage (cleared when tab closes)
        sessionStorage.setItem(`${this.sessionId}_${key}`, encryptedValue);
        
        // Also store a reference in localStorage for session recovery
        const sessionRefs = JSON.parse(localStorage.getItem('secure_session_refs') || '{}');
        sessionRefs[key] = {
          sessionId: this.sessionId,
          timestamp: Date.now(),
          encrypted: true
        };
        localStorage.setItem('secure_session_refs', JSON.stringify(sessionRefs));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Secure storage set error:', error);
      return false;
    }
  }

  // Retrieve data securely
  getItem(key) {
    try {
      // Try sessionStorage first
      const encryptedValue = sessionStorage.getItem(`${this.sessionId}_${key}`);
      if (encryptedValue) {
        return this.decrypt(encryptedValue);
      }

      // Fallback to localStorage if session expired
      const sessionRefs = JSON.parse(localStorage.getItem('secure_session_refs') || '{}');
      const sessionRef = sessionRefs[key];
      
      if (sessionRef && sessionRef.encrypted) {
        // Check if session is still valid (24 hours)
        const sessionAge = Date.now() - sessionRef.timestamp;
        if (sessionAge < 24 * 60 * 60 * 1000) {
          const fallbackValue = localStorage.getItem(`secure_${key}`);
          if (fallbackValue) {
            return this.decrypt(fallbackValue);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  // Remove data securely
  removeItem(key) {
    try {
      // Remove from sessionStorage
      sessionStorage.removeItem(`${this.sessionId}_${key}`);
      
      // Remove from localStorage
      localStorage.removeItem(`secure_${key}`);
      
      // Remove session reference
      const sessionRefs = JSON.parse(localStorage.getItem('secure_session_refs') || '{}');
      delete sessionRefs[key];
      localStorage.setItem('secure_session_refs', JSON.stringify(sessionRefs));
      
      return true;
    } catch (error) {
      console.error('Secure storage remove error:', error);
      return false;
    }
  }

  // Clear all secure storage for this session
  clear() {
    try {
      // Clear sessionStorage for this session
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.sessionId)) {
          sessionStorage.removeItem(key);
        }
      });

      // Clear localStorage references
      localStorage.removeItem('secure_session_refs');
      
      return true;
    } catch (error) {
      console.error('Secure storage clear error:', error);
      return false;
    }
  }

  // Get all keys for this session
  keys() {
    try {
      const keys = Object.keys(sessionStorage);
      return keys
        .filter(key => key.startsWith(this.sessionId))
        .map(key => key.replace(`${this.sessionId}_`, ''));
    } catch (error) {
      console.error('Secure storage keys error:', error);
      return [];
    }
  }

  // Check if key exists
  hasKey(key) {
    try {
      return sessionStorage.hasOwnProperty(`${this.sessionId}_${key}`) ||
             localStorage.hasOwnProperty(`secure_${key}`);
    } catch (error) {
      return false;
    }
  }

  // Get storage size (approximate)
  getSize() {
    try {
      let size = 0;
      
      // Session storage size
      this.keys().forEach(key => {
        const value = sessionStorage.getItem(`${this.sessionId}_${key}`);
        size += value ? value.length : 0;
      });
      
      // Local storage size (encrypted)
      const sessionRefs = JSON.parse(localStorage.getItem('secure_session_refs') || '{}');
      Object.keys(sessionRefs).forEach(key => {
        const value = localStorage.getItem(`secure_${key}`);
        size += value ? value.length : 0;
      });
      
      return size;
    } catch (error) {
      return 0;
    }
  }
}

// Create singleton instance
const secureStorage = new SecureStorage();

export default secureStorage;
