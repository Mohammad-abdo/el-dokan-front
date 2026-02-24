import { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

const LanguageContext = createContext();

const translations = { en, ar };

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
      if (!value) return key;
    }

    return value;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
