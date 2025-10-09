import React, { createContext, useState, useContext, useEffect } from 'react';

/**
 * Language Context for React applications
 * 
 * This context provides language-related functionality to React components,
 * including translation, language switching, and text direction.
 */

// Create the context
const LanguageContext = createContext();

/**
 * Language Provider Component
 * 
 * Wraps the application to provide language functionality to all components.
 */
export const LanguageProvider = ({ 
  children, 
  defaultLanguage = 'en',
  translations = {},
  persistKey = 'meetingmind_language'
}) => {
  // Get initial language from localStorage if available
  const getInitialLanguage = () => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(persistKey);
      if (savedLanguage) return savedLanguage;
      
      // Try to detect from browser
      const browserLang = navigator.language?.split('-')[0];
      if (browserLang && isLanguageSupported(browserLang)) return browserLang;
    }
    
    return defaultLanguage;
  };
  
  // State
  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);
  const [isRTL, setIsRTL] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState([
    { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' }
  ]);
  
  // Check if a language is supported
  const isLanguageSupported = (code) => {
    return supportedLanguages.some(lang => lang.code === code);
  };
  
  // Change language
  const changeLanguage = (languageCode) => {
    if (!isLanguageSupported(languageCode)) {
      console.warn(`Language ${languageCode} is not supported. Using default language.`);
      languageCode = defaultLanguage;
    }
    
    setCurrentLanguage(languageCode);
    
    // Persist language preference
    if (typeof window !== 'undefined') {
      localStorage.setItem(persistKey, languageCode);
    }
    
    // Update RTL status
    const language = supportedLanguages.find(lang => lang.code === languageCode);
    setIsRTL(language?.direction === 'rtl');
    
    return true;
  };
  
  // Translate a string
  const translate = (key, params = {}) => {
    // Get translations for current language
    const languageTranslations = translations[currentLanguage] || {};
    
    // Get translation or fallback
    let translation = languageTranslations[key];
    
    // If translation not found, try fallback language
    if (!translation && currentLanguage !== defaultLanguage) {
      const fallbackTranslations = translations[defaultLanguage] || {};
      translation = fallbackTranslations[key];
    }
    
    // If still not found, return the key itself
    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }
    
    // Replace parameters in translation
    if (params && Object.keys(params).length > 0) {
      translation = translation.replace(/{(\w+)}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return translation;
  };
  
  // Format date according to current language
  const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    try {
      return new Intl.DateTimeFormat(currentLanguage, options).format(dateObj);
    } catch (error) {
      console.error('Date formatting failed:', error);
      return dateObj.toISOString();
    }
  };
  
  // Format number according to current language
  const formatNumber = (number, options = {}) => {
    if (number === null || number === undefined) return '';
    
    try {
      return new Intl.NumberFormat(currentLanguage, options).format(number);
    } catch (error) {
      console.error('Number formatting failed:', error);
      return number.toString();
    }
  };
  
  // Update document direction when language changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage, isRTL]);
  
  // Context value
  const contextValue = {
    currentLanguage,
    supportedLanguages,
    isRTL,
    changeLanguage,
    translate,
    formatDate,
    formatNumber,
    t: translate // Shorthand for translate
  };
  
  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to use the language context
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext;
