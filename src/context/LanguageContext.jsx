import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../utils/translations";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return (typeof localStorage !== 'undefined' && localStorage.getItem("preferred_lang")) || "en";
    } catch (e) {
      return "en";
    }
  });

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

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ur" : "en"));
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, isRtl: lang === "ur" }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
