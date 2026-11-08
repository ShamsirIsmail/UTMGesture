// ============================================================
// UTM Gesture Quest V3.0 — Translation Hook & Context
// ============================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS, type TranslationKey } from './translations';
import type { Language } from '../types';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const TranslationContext = createContext<TranslationContextType | null>(null);

const STORAGE_KEY = 'utm_gesture_lang';

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bm' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'bm'; // Default to Bahasa Melayu
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'bm' ? 'en' : 'bm');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = TRANSLATIONS[language] || TRANSLATIONS.bm;
      return dict[key] || TRANSLATIONS.bm[key] || key;
    },
    [language]
  );

  return (
    <TranslationContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
