/**
 * MeetingMind Enhanced Security Service
 * 
 * This module provides comprehensive security features for the MeetingMind application,
 * including encryption, secure storage, access control, and audit logging.
 */

const crypto = require('crypto');

class SecurityService {
  constructor(options = {}) {
    this.options = {
      encryptionAlgorithm: 'aes-256-gcm',
      keyDerivationIterations: 100000,
      keyLength: 32,
      saltLength: 16,
      ivLength: 12,
      tagLength: 16,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 12,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      sensitiveFields: ['apiKey', 'password', 'token', 'secret'],
      auditLogEnabled: true,
      auditLogRetention: 90, // days
      ...options
    };
    
    this.initialized = false;
    this.masterKey = null;
    this.loginAttempts = new Map();
    this.auditLog = [];
  }
  
  /**
   * Initialize the security service
   */
  async initialize(masterKeyOrPassword) {
    try {
      if (!masterKeyOrPassword) {
        throw new Error('Master key or password is required for initialization');
      }
      
      // Derive or set master key
      if (typeof masterKeyOrPassword === 'string') {
        // Derive master key from password
        const salt = crypto.randomBytes(this.options.saltLength);
        this.masterKey = await this._deriveKey(masterKeyOrPassword, salt);
      } else if (Buffer.isBuffer(masterKeyOrPassword) && masterKeyOrPassword.length === this.options.keyLength) {
        // Use provided master key directly
        this.masterKey = Buffer.from(masterKeyOrPassword);
      } else {
        throw new Error('Invalid master key format');
      }
      
      this.initialized = true;
      this._logAudit('security_service_initialized', { success: true });
      return true;
    } catch (error) {
      console.error('Failed to initialize Security Service:', error);
      this._logAudit('security_service_initialized', { success: false, error: error.message });
      return false;
    }
  }
  
  /**
   * Encrypt sensitive data
   */
  async encrypt(data, context = {}) {
    this._checkInitialized();
    
    try {
      // Convert data to string if it's not already
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Generate random IV
      const iv = crypto.randomBytes(this.options.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(
        this.options.encryptionAlgorithm,
        this.masterKey,
        iv
      );
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Create result object with all necessary components for decryption
      const result = {
        version: 1,
        algorithm: this.options.encryptionAlgorithm,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
        encrypted: encrypted,
        metadata: {
          timestamp: new Date().toISOString(),
          context: this._sanitizeContext(context)
        }
      };
      
      this._logAudit('data_encrypted', { success: true, context: this._sanitizeContext(context) });
      return result;
    } catch (error) {
      console.error('Encryption failed:', error);
      this._logAudit('data_encrypted', { success: false, error: error.message, context: this._sanitizeContext(context) });
      throw new Error('Encryption failed');
    }
  }
  
  /**
   * Decrypt encrypted data
   */
  async decrypt(encryptedData, context = {}) {
    this._checkInitialized();
    
    try {
      // Validate encrypted data format
      if (!encryptedData || !encryptedData.iv || !encryptedData.authTag || !encryptedData.encrypted) {
        throw new Error('Invalid encrypted data format');
      }
      
      // Parse components
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const authTag = Buffer.from(encryptedData.authTag, 'base64');
      const algorithm = encryptedData.algorithm || this.options.encryptionAlgorithm;
      
      // Create decipher
      const decipher = crypto.createDecipheriv(
        algorithm,
        this.masterKey,
        iv
      );
      
      // Set auth tag
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Parse JSON if the original data was an object
      let result;
      try {
        result = JSON.parse(decrypted);
      } catch (e) {
        // If parsing fails, return as string
        result = decrypted;
      }
      
      this._logAudit('data_decrypted', { success: true, context: this._sanitizeContext(context) });
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      this._logAudit('data_decrypted', { success: false, error: error.message, context: this._sanitizeContext(context) });
      throw new Error('Decryption failed');
    }
  }
  
  /**
   * Hash a password securely
   */
  async hashPassword(password) {
    try {
      // Generate random salt
      const salt = crypto.randomBytes(this.options.saltLength);
      
      // Derive key using PBKDF2
      const derivedKey = await this._deriveKey(password, salt);
      
      // Return hashed password with salt
      return {
        hash: derivedKey.toString('base64'),
        salt: salt.toString('base64'),
        algorithm: 'PBKDF2',
        iterations: this.options.keyDerivationIterations,
        keyLength: this.options.keyLength
      };
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }
  
  /**
   * Verify a password against a stored hash
   */
  async verifyPassword(password, storedHash) {
    try {
      // Validate stored hash format
      if (!storedHash || !storedHash.hash || !storedHash.salt) {
        throw new Error('Invalid stored hash format');
      }
      
      // Parse components
      const salt = Buffer.from(storedHash.salt, 'base64');
      const iterations = storedHash.iterations || this.options.keyDerivationIterations;
      const keyLength = storedHash.keyLength || this.options.keyLength;
      
      // Derive key using the same parameters
      const derivedKey = await this._pbkdf2(
        password,
        salt,
        iterations,
        keyLength
      );
      
      // Compare with stored hash
      const isValid = crypto.timingSafeEqual(
        derivedKey,
        Buffer.from(storedHash.hash, 'base64')
      );
      
      return isValid;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }
  
  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const result = {
      isValid: true,
      errors: []
    };
    
    // Check minimum length
    if (password.length < this.options.passwordMinLength) {
      result.isValid = false;
      result.errors.push(`Password must be at least ${this.options.passwordMinLength} characters long`);
    }
    
    // Check for uppercase letters
    if (this.options.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letters
    if (this.options.passwordRequireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for numbers
    if (this.options.passwordRequireNumbers && !/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }
    
    // Check for symbols
    if (this.options.passwordRequireSymbols && !/[^A-Za-z0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one special character');
    }
    
    // Calculate password strength score (0-100)
    let strengthScore = 0;
    
    // Base score from length (up to 40 points)
    strengthScore += Math.min(40, password.length * 2);
    
    // Additional points for character variety (up to 60 points)
    if (/[A-Z]/.test(password)) strengthScore += 10;
    if (/[a-z]/.test(password)) strengthScore += 10;
    if (/[0-9]/.test(password)) strengthScore += 10;
    if (/[^A-Za-z0-9]/.test(password)) strengthScore += 15;
    
    // Additional points for mixed character types
    const charTypesCount = [
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ].filter(Boolean).length;
    
    strengthScore += (charTypesCount - 1) * 5;
    
    // Cap at 100
    strengthScore = Math.min(100, strengthScore);
    
    result.strengthScore = strengthScore;
    
    // Determine strength level
    if (strengthScore >= 80) {
      result.strengthLevel = 'strong';
    } else if (strengthScore >= 60) {
      result.strengthLevel = 'good';
    } else if (strengthScore >= 40) {
      result.strengthLevel = 'medium';
    } else {
      result.strengthLevel = 'weak';
    }
    
    return result;
  }
  
  /**
   * Track login attempt and check for account lockout
   */
  trackLoginAttempt(userId, success) {
    // Get current attempts for this user
    const userAttempts = this.loginAttempts.get(userId) || {
      count: 0,
      lastAttempt: null,
      lockedUntil: null
    };
    
    const now = Date.now();
    
    // Check if account is locked
    if (userAttempts.lockedUntil && now < userAttempts.lockedUntil) {
      const remainingLockTime = Math.ceil((userAttempts.lockedUntil - now) / 1000 / 60);
      
      this._logAudit('login_attempt', {
        userId,
        success: false,
        reason: 'account_locked',
        remainingLockTime
      });
      
      return {
        allowed: false,
        locked: true,
        remainingLockTime
      };
    }
    
    // Reset on successful login
    if (success) {
      this.loginAttempts.delete(userId);
      
      this._logAudit('login_attempt', {
        userId,
        success: true
      });
      
      return {
        allowed: true,
        locked: false
      };
    }
    
    // Increment failed attempts
    userAttempts.count += 1;
    userAttempts.lastAttempt = now;
    
    // Lock account if max attempts reached
    if (userAttempts.count >= this.options.maxLoginAttempts) {
      userAttempts.lockedUntil = now + this.options.lockoutDuration;
      
      const remainingLockTime = Math.ceil(this.options.lockoutDuration / 1000 / 60);
      
      this._logAudit('login_attempt', {
        userId,
        success: false,
        reason: 'max_attempts_reached',
        attempts: userAttempts.count,
        lockedUntil: new Date(userAttempts.lockedUntil).toISOString(),
        lockDuration: remainingLockTime
      });
      
      this.loginAttempts.set(userId, userAttempts);
      
      return {
        allowed: false,
        locked: true,
        remainingLockTime
      };
    }
    
    // Update attempts
    this.loginAttempts.set(userId, userAttempts);
    
    this._logAudit('login_attempt', {
      userId,
      success: false,
      reason: 'invalid_credentials',
      attempts: userAttempts.count,
      remainingAttempts: this.options.maxLoginAttempts - userAttempts.count
    });
    
    return {
      allowed: true,
      locked: false,
      remainingAttempts: this.options.maxLoginAttempts - userAttempts.count
    };
  }
  
  /**
   * Generate a secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('base64').replace(/[/+=]/g, '').substring(0, length);
  }
  
  /**
   * Sanitize data by redacting sensitive fields
   */
  sanitizeData(data) {
    if (!data) return data;
    
    // Handle different data types
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    // Handle objects
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Check if this is a sensitive field
      const isSensitive = this.options.sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        // Redact sensitive value
        if (typeof sanitized[key] === 'string') {
          const firstChar = sanitized[key].charAt(0);
          const lastChar = sanitized[key].charAt(sanitized[key].length - 1);
          sanitized[key] = `${firstChar}****${lastChar}`;
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  }
  
  /**
   * Get audit logs with filtering options
   */
  getAuditLogs(options = {}) {
    if (!this.options.auditLogEnabled) {
      return [];
    }
    
    let logs = [...this.auditLog];
    
    // Apply filters
    if (options.eventType) {
      logs = logs.filter(log => log.eventType === options.eventType);
    }
    
    if (options.userId) {
      logs = logs.filter(log => log.data?.userId === options.userId);
    }
    
    if (options.success !== undefined) {
      logs = logs.filter(log => log.data?.success === options.success);
    }
    
    if (options.startDate) {
      const startDate = new Date(options.startDate).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= startDate);
    }
    
    if (options.endDate) {
      const endDate = new Date(options.endDate).getTime();
      logs = logs.filter(log => new Date(log.timestamp).getTime() <= endDate);
    }
    
    // Apply sorting
    if (options.sortBy) {
      const sortField = options.sortBy;
      const sortOrder = options.sortOrder === 'asc' ? 1 : -1;
      
      logs.sort((a, b) => {
        if (sortField === 'timestamp') {
          return sortOrder * (new Date(a.timestamp) - new Date(b.timestamp));
        }
        
        return 0;
      });
    } else {
      // Default sort by timestamp descending
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    // Apply pagination
    if (options.limit) {
      const offset = options.offset || 0;
      logs = logs.slice(offset, offset + options.limit);
    }
    
    return logs;
  }
  
  /**
   * Clear expired audit logs
   */
  clearExpiredAuditLogs() {
    if (!this.options.auditLogEnabled || !this.options.auditLogRetention) {
      return 0;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.auditLogRetention);
    
    const initialCount = this.auditLog.length;
    
    this.auditLog = this.auditLog.filter(log => 
      new Date(log.timestamp) >= cutoffDate
    );
    
    return initialCount - this.auditLog.length;
  }
  
  /**
   * Private methods
   */
  
  /**
   * Derive a key from a password using PBKDF2
   */
  async _deriveKey(password, salt) {
    return this._pbkdf2(
      password,
      salt,
      this.options.keyDerivationIterations,
      this.options.keyLength
    );
  }
  
  /**
   * PBKDF2 implementation with Promise
   */
  _pbkdf2(password, salt, iterations, keyLength) {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        iterations,
        keyLength,
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        }
      );
    });
  }
  
  /**
   * Check if the service is initialized
   */
  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('Security service not initialized. Call initialize() first.');
    }
  }
  
  /**
   * Log an audit event
   */
  _logAudit(eventType, data = {}) {
    if (!this.options.auditLogEnabled) {
      return;
    }
    
    const auditEntry = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      eventType,
      data: this._sanitizeContext(data)
    };
    
    this.auditLog.push(auditEntry);
    
    // Trim audit log if it gets too large
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }
  
  /**
   * Sanitize context data for audit logs
   */
  _sanitizeContext(context) {
    return this.sanitizeData(context);
  }
}

// Export the security service
module.exports = SecurityService;
