import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, languageNames, type SupportedLanguage } from './translations';

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  languageNames: Record<SupportedLanguage, string>;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const stored = localStorage.getItem('app.language') as SupportedLanguage | null;
    if (stored && (stored === 'en' || stored === 'ta' || stored === 'te')) {
      setLanguage(stored);
    }
  }, []);

  const updateLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    localStorage.setItem('app.language', lang);
    const html = document.querySelector('html');
    if (html) html.setAttribute('lang', lang);
  };

  const t = useMemo(() => {
    return (key: string) => translations[language][key] ?? translations.en[key] ?? key;
  }, [language]);

  const value: LanguageContextValue = useMemo(() => ({
    language,
    setLanguage: updateLanguage,
    t,
    languageNames,
  }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};


