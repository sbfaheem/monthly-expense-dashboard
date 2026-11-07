import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../utils/translations";
import { getUrlParam, updateUrlParams } from "../utils/urlState";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const urlLang = getUrlParam('lang');
      if (urlLang === 'ur' || urlLang === 'en') {
        return urlLang;
      }
      return (typeof localStorage !== 'undefined' && localStorage.getItem("preferred_lang")) || "en";
    } catch (e) {
      return "en";
    }
  });

  // Keep DOM (dir, font class, html tag) & localStorage synced with lang
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem("preferred_lang", lang);
      }
    } catch (e) {
      // ignore storage error
    }
    const direction = lang === "ur" ? "rtl" : "ltr";
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.lang = lang;
      
      // Apply Urdu font class when Urdu is active
      if (lang === "ur") {
        document.body.classList.add("font-urdu");
      } else {
        document.body.classList.remove("font-urdu");
      }
    }
  }, [lang]);

  // Ensure initial URL reflects the active language if not already present
  useEffect(() => {
    const currentUrlLang = getUrlParam('lang');
    if (!currentUrlLang) {
      updateUrlParams({ lang }, false); // replaceState on first load
    }
  }, []);

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const urlLang = getUrlParam('lang');
      if ((urlLang === 'ur' || urlLang === 'en') && urlLang !== lang) {
        setLangState(urlLang);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [lang]);

  // Explicit setter that updates state and URL
  const setLang = (newLang, pushToHistory = true) => {
    if (newLang !== 'en' && newLang !== 'ur') return;
    setLangState(newLang);
    updateUrlParams({ lang: newLang }, pushToHistory);
  };

  const toggleLanguage = () => {
    const next = lang === "en" ? "ur" : "en";
    setLang(next, true);
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, isRtl: lang === "ur" }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
