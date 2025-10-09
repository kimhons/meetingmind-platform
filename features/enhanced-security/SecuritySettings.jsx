import React, { useState } from 'react';
import { useSecurity } from './SecurityContext';
import { Shield, Lock, Eye, EyeOff, Check, AlertTriangle, Info } from 'lucide-react';

/**
 * SecuritySettings Component
 * 
 * A component that allows users to view and modify security settings.
 */
const SecuritySettings = ({ 
  className = '',
  onSave = () => {}
}) => {
  const { 
    securityLevel, 
    securitySettings, 
    setSecurityLevel,
    availableSecurityLevels,
    validatePasswordStrength,
    getAuditLogs
  } = useSecurity();
  
  const [selectedLevel, setSelectedLevel] = useState(securityLevel);
  const [passwordSample, setPasswordSample] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Handle security level change
  const handleSecurityLevelChange = (level) => {
    setSelectedLevel(level);
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    setSecurityLevel(selectedLevel);
    onSave(selectedLevel);
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Handle password sample change
  const handlePasswordSampleChange = (e) => {
    setPasswordSample(e.target.value);
  };
  
  // Get password validation result
  const passwordValidation = validatePasswordStrength(passwordSample);
  
  // Get strength color
  const getStrengthColor = () => {
    if (!passwordSample) return 'bg-gray-300';
    
    switch (passwordValidation.strengthLevel) {
      case 'strong':
        return 'bg-green-500';
      case 'good':
        return 'bg-blue-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'weak':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };
  
  // Load audit logs
  const handleLoadAuditLogs = () => {
    const logs = getAuditLogs({ limit: 10 });
    setAuditLogs(logs);
    setShowAuditLog(true);
  };
  
  // Security level descriptions
  const securityLevelDescriptions = {
    standard: 'Balanced security for most users. Includes strong password requirements and session timeouts.',
    high: 'Enhanced security with stricter password requirements and shorter session timeouts.',
    enterprise: 'Maximum security with two-factor authentication requirement and comprehensive audit logging.'
  };
  
  return (
    <div className={`bg-slate-800 rounded-lg p-6 text-white ${className}`}>
      <div className="flex items-center mb-6">
        <Shield className="w-6 h-6 mr-2 text-teal-400" />
        <h2 className="text-xl font-semibold">Security Settings</h2>
      </div>
      
      {/* Security Level Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Security Level</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableSecurityLevels.map((level) => (
            <div 
              key={level}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedLevel === level 
                  ? 'border-teal-400 bg-slate-700' 
                  : 'border-slate-600 hover:border-slate-500'
              }`}
              onClick={() => handleSecurityLevelChange(level)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{level}</span>
                {selectedLevel === level && (
                  <Check className="w-5 h-5 text-teal-400" />
                )}
              </div>
              <p className="text-sm text-gray-300">
                {securityLevelDescriptions[level]}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Security Settings */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Lock className="w-5 h-5 mr-2 text-teal-400" />
          <h3 className="text-lg font-medium">Current Security Settings</h3>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-300 mb-1">Session Timeout</p>
              <p className="font-medium">{securitySettings.sessionTimeout / 60000} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-1">Password Minimum Length</p>
              <p className="font-medium">{securitySettings.passwordMinLength} characters</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-1">Login Attempts Before Lockout</p>
              <p className="font-medium">{securitySettings.maxLoginAttempts} attempts</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-1">Account Lockout Duration</p>
              <p className="font-medium">{securitySettings.lockoutDuration / 60000} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-1">Two-Factor Authentication</p>
              <p className="font-medium">{securitySettings.twoFactorRequired ? 'Required' : 'Optional'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-300 mb-1">Audit Logging</p>
              <p className="font-medium">{securitySettings.auditLogEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Password Strength Tester */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Lock className="w-5 h-5 mr-2 text-teal-400" />
          <h3 className="text-lg font-medium">Password Strength Tester</h3>
        </div>
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordSample}
              onChange={handlePasswordSampleChange}
              placeholder="Enter a password to test its strength"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {passwordSample && (
            <>
              <div className="mb-2">
                <div className="h-2 w-full bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()}`}
                    style={{ width: `${passwordValidation.strengthScore}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <span className="text-sm font-medium capitalize">
                  {passwordValidation.strengthLevel || 'Invalid'} Password
                </span>
                <span className="ml-auto text-sm text-gray-300">
                  Score: {passwordValidation.strengthScore}/100
                </span>
              </div>
              
              {!passwordValidation.isValid && (
                <div className="bg-slate-800 rounded-lg p-3 mb-3">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-500 mb-1">Password does not meet requirements:</p>
                      <ul className="text-sm text-gray-300 list-disc list-inside">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {passwordValidation.isValid && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">
                      This password meets all security requirements.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Audit Log */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Info className="w-5 h-5 mr-2 text-teal-400" />
            <h3 className="text-lg font-medium">Security Audit Log</h3>
          </div>
          <button
            type="button"
            onClick={handleLoadAuditLogs}
            className="text-sm text-teal-400 hover:text-teal-300"
          >
            {showAuditLog ? 'Refresh' : 'View Recent Events'}
          </button>
        </div>
        
        {showAuditLog && (
          <div className="bg-slate-700 rounded-lg p-4 overflow-x-auto">
            {auditLogs.length > 0 ? (
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-2">Time</th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-2">Event</th>
                    <th className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-600">
                      <td className="py-2 text-sm">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 text-sm">
                        {log.eventType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 text-sm text-gray-300">
                        {Object.entries(log.data).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span>{' '}
                            {typeof value === 'boolean' 
                              ? (value ? 'Yes' : 'No')
                              : String(value)
                            }
                          </div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-300">No recent security events.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          disabled={selectedLevel === securityLevel}
        >
          Save Security Settings
        </button>
      </div>
    </div>
  );
};

export default SecuritySettings;
