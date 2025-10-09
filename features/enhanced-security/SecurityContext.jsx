import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * Security Context for React applications
 * 
 * This context provides security-related functionality to React components,
 * including secure storage, password validation, and security settings.
 */

// Create the context
const SecurityContext = createContext();

/**
 * Security Provider Component
 * 
 * Wraps the application to provide security functionality to all components.
 */
export const SecurityProvider = ({ 
  children,
  initialSecurityLevel = 'standard',
  sensitiveFields = ['apiKey', 'password', 'token', 'secret'],
  persistKey = 'meetingmind_security_settings'
}) => {
  // Security levels and their settings
  const securityLevels = {
    standard: {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      passwordMinLength: 12,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      auditLogEnabled: true,
      auditLogRetention: 90, // days
      encryptLocalStorage: false,
      twoFactorRequired: false
    },
    high: {
      sessionTimeout: 15 * 60 * 1000, // 15 minutes
      passwordMinLength: 14,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      maxLoginAttempts: 3,
      lockoutDuration: 30 * 60 * 1000, // 30 minutes
      auditLogEnabled: true,
      auditLogRetention: 180, // days
      encryptLocalStorage: true,
      twoFactorRequired: false
    },
    enterprise: {
      sessionTimeout: 10 * 60 * 1000, // 10 minutes
      passwordMinLength: 16,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: true,
      maxLoginAttempts: 3,
      lockoutDuration: 60 * 60 * 1000, // 60 minutes
      auditLogEnabled: true,
      auditLogRetention: 365, // days
      encryptLocalStorage: true,
      twoFactorRequired: true
    }
  };
  
  // Get initial settings from localStorage if available
  const getInitialSettings = () => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(persistKey);
      if (savedSettings) {
        try {
          return JSON.parse(savedSettings);
        } catch (e) {
          console.error('Failed to parse saved security settings:', e);
        }
      }
    }
    
    return securityLevels[initialSecurityLevel] || securityLevels.standard;
  };
  
  // State
  const [securityLevel, setSecurityLevel] = useState(initialSecurityLevel);
  const [securitySettings, setSecuritySettings] = useState(getInitialSettings);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [sessionWarningShown, setSessionWarningShown] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  
  // Update security settings when security level changes
  useEffect(() => {
    const newSettings = securityLevels[securityLevel] || securityLevels.standard;
    setSecuritySettings(newSettings);
    
    // Persist settings
    if (typeof window !== 'undefined') {
      localStorage.setItem(persistKey, JSON.stringify(newSettings));
    }
    
    // Reset session timer
    resetSessionTimer();
    
    // Log security level change
    logSecurityEvent('security_level_changed', { 
      level: securityLevel,
      settings: sanitizeData(newSettings)
    });
  }, [securityLevel]);
  
  // Session timeout handling
  useEffect(() => {
    if (!securitySettings.sessionTimeout) return;
    
    const warningTime = securitySettings.sessionTimeout * 0.8; // Show warning at 80% of timeout
    
    const activityHandler = () => {
      resetSessionTimer();
      setSessionWarningShown(false);
    };
    
    // Set up activity listeners
    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('click', activityHandler);
    window.addEventListener('scroll', activityHandler);
    window.addEventListener('touchstart', activityHandler);
    
    // Initial session timer
    resetSessionTimer();
    
    // Clean up
    return () => {
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('scroll', activityHandler);
      window.removeEventListener('touchstart', activityHandler);
    };
  }, [securitySettings.sessionTimeout]);
  
  // Check for session expiry
  useEffect(() => {
    if (!sessionExpiry) return;
    
    const warningTime = securitySettings.sessionTimeout * 0.8; // Show warning at 80% of timeout
    const warningTimeoutMs = sessionExpiry - Date.now() - (securitySettings.sessionTimeout - warningTime);
    
    const sessionCheckInterval = setInterval(() => {
      const now = Date.now();
      
      if (sessionExpiry && now >= sessionExpiry) {
        // Session expired
        handleSessionExpired();
      } else if (!sessionWarningShown && sessionExpiry - now <= warningTime) {
        // Show warning
        setSessionWarningShown(true);
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [sessionExpiry, sessionWarningShown, securitySettings.sessionTimeout]);
  
  // Reset session timer
  const resetSessionTimer = () => {
    if (!securitySettings.sessionTimeout) return;
    
    const newExpiry = Date.now() + securitySettings.sessionTimeout;
    setSessionExpiry(newExpiry);
  };
  
  // Handle session expiry
  const handleSessionExpired = () => {
    // Log event
    logSecurityEvent('session_expired', {});
    
    // Clear sensitive data
    // This would typically trigger a logout action
    // For this implementation, we'll just reset the timer
    resetSessionTimer();
  };
  
  // Validate password strength
  const validatePasswordStrength = (password) => {
    const result = {
      isValid: true,
      errors: []
    };
    
    // Check minimum length
    if (password.length < securitySettings.passwordMinLength) {
      result.isValid = false;
      result.errors.push(`Password must be at least ${securitySettings.passwordMinLength} characters long`);
    }
    
    // Check for uppercase letters
    if (securitySettings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letters
    if (securitySettings.passwordRequireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for numbers
    if (securitySettings.passwordRequireNumbers && !/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }
    
    // Check for symbols
    if (securitySettings.passwordRequireSymbols && !/[^A-Za-z0-9]/.test(password)) {
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
  };
  
  // Securely store data in localStorage
  const secureStore = (key, data) => {
    if (typeof window === 'undefined') return false;
    
    try {
      // For actual implementation, this would use encryption
      // For this implementation, we'll just use JSON.stringify
      const serialized = JSON.stringify(data);
      localStorage.setItem(`secure_${key}`, serialized);
      
      logSecurityEvent('secure_store', { key });
      return true;
    } catch (error) {
      console.error('Secure store failed:', error);
      return false;
    }
  };
  
  // Retrieve securely stored data
  const secureRetrieve = (key) => {
    if (typeof window === 'undefined') return null;
    
    try {
      const serialized = localStorage.getItem(`secure_${key}`);
      if (!serialized) return null;
      
      // For actual implementation, this would use decryption
      // For this implementation, we'll just use JSON.parse
      const data = JSON.parse(serialized);
      
      logSecurityEvent('secure_retrieve', { key });
      return data;
    } catch (error) {
      console.error('Secure retrieve failed:', error);
      return null;
    }
  };
  
  // Remove securely stored data
  const secureRemove = (key) => {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(`secure_${key}`);
      
      logSecurityEvent('secure_remove', { key });
      return true;
    } catch (error) {
      console.error('Secure remove failed:', error);
      return false;
    }
  };
  
  // Generate a secure random token
  const generateSecureToken = (length = 32) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };
  
  // Sanitize data by redacting sensitive fields
  const sanitizeData = (data) => {
    if (!data) return data;
    
    // Handle different data types
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => sanitizeData(item));
    }
    
    // Handle objects
    const sanitized = { ...data };
    
    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      
      // Check if this is a sensitive field
      const isSensitive = sensitiveFields.some(field => 
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
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    }
    
    return sanitized;
  };
  
  // Log security event
  const logSecurityEvent = (eventType, data = {}) => {
    if (!securitySettings.auditLogEnabled) {
      return;
    }
    
    const auditEntry = {
      id: generateSecureToken(16),
      timestamp: new Date().toISOString(),
      eventType,
      data: sanitizeData(data)
    };
    
    setAuditLog(prevLog => {
      const newLog = [auditEntry, ...prevLog];
      
      // Trim audit log if it gets too large
      if (newLog.length > 1000) {
        return newLog.slice(0, 500);
      }
      
      return newLog;
    });
  };
  
  // Get audit logs with filtering options
  const getAuditLogs = (options = {}) => {
    if (!securitySettings.auditLogEnabled) {
      return [];
    }
    
    let logs = [...auditLog];
    
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
  };
  
  // Clear expired audit logs
  const clearExpiredAuditLogs = () => {
    if (!securitySettings.auditLogEnabled || !securitySettings.auditLogRetention) {
      return 0;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - securitySettings.auditLogRetention);
    
    const initialCount = auditLog.length;
    
    setAuditLog(prevLog => 
      prevLog.filter(log => new Date(log.timestamp) >= cutoffDate)
    );
    
    return initialCount - auditLog.length;
  };
  
  // Context value
  const contextValue = {
    securityLevel,
    securitySettings,
    setSecurityLevel,
    sessionExpiry,
    sessionWarningShown,
    resetSessionTimer,
    validatePasswordStrength,
    secureStore,
    secureRetrieve,
    secureRemove,
    generateSecureToken,
    sanitizeData,
    logSecurityEvent,
    getAuditLogs,
    clearExpiredAuditLogs,
    availableSecurityLevels: Object.keys(securityLevels)
  };
  
  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Custom hook to use the security context
 */
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  
  return context;
};

export default SecurityContext;
