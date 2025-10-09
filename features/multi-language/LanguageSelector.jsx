import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

/**
 * LanguageSelector Component
 * 
 * A dropdown component that allows users to select their preferred language.
 */
const LanguageSelector = ({ 
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  showFlags = true,
  showNativeNames = true,
  compact = false
}) => {
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get current language details
  const currentLangDetails = supportedLanguages.find(lang => lang.code === currentLanguage) || 
    { code: 'en', name: 'English', nativeName: 'English' };
  
  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);
  
  // Close dropdown
  const closeDropdown = () => setIsOpen(false);
  
  // Handle language selection
  const handleLanguageSelect = (code) => {
    changeLanguage(code);
    closeDropdown();
  };
  
  // Get flag emoji for a language
  const getLanguageFlag = (code) => {
    const flagEmojis = {
      'en': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
      'ko': '🇰🇷',
      'ar': '🇸🇦',
      'hi': '🇮🇳',
      'pt': '🇵🇹',
      'ru': '🇷🇺',
      'it': '🇮🇹'
    };
    
    return flagEmojis[code] || '🌐';
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Language selector button */}
      <button
        className={`flex items-center justify-between rounded-md bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 text-sm transition-colors ${buttonClassName}`}
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {compact ? (
          <Globe className="w-5 h-5" />
        ) : (
          <>
            {showFlags && (
              <span className="mr-2" aria-hidden="true">
                {getLanguageFlag(currentLangDetails.code)}
              </span>
            )}
            <span className="mr-1">
              {showNativeNames ? currentLangDetails.nativeName : currentLangDetails.name}
            </span>
            <ChevronDown className="w-4 h-4 ml-1" />
          </>
        )}
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop for closing dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={closeDropdown}
            aria-hidden="true"
          />
          
          {/* Dropdown content */}
          <div 
            className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-20 py-1 ${dropdownClassName}`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="language-menu"
          >
            <div className="py-1">
              {supportedLanguages.map((language) => (
                <button
                  key={language.code}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${
                    currentLanguage === language.code 
                      ? 'bg-slate-700 text-white' 
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  onClick={() => handleLanguageSelect(language.code)}
                  role="menuitem"
                >
                  {showFlags && (
                    <span className="mr-2" aria-hidden="true">
                      {getLanguageFlag(language.code)}
                    </span>
                  )}
                  <span className="flex-1">
                    {showNativeNames ? (
                      <>
                        <span className="block">{language.nativeName}</span>
                        {language.nativeName !== language.name && (
                          <span className="block text-xs text-gray-400">{language.name}</span>
                        )}
                      </>
                    ) : (
                      <span>{language.name}</span>
                    )}
                  </span>
                  {currentLanguage === language.code && (
                    <Check className="w-4 h-4 ml-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
