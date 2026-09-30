import React from "react";
import { useLanguage } from "../context/LanguageContext";

export const LanguageSwitcher = () => {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      aria-label="Toggle Language"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm hover:bg-slate-50 dark:hover:bg-slate-750 transition-all text-xs font-semibold text-slate-700 dark:text-slate-200"
    >
      <span className="text-base">🌐</span>
      <span className={lang === "en" ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}>English</span>
      <span className="text-slate-300 dark:text-slate-600">|</span>
      <span className={lang === "ur" ? "text-emerald-600 dark:text-emerald-400 font-bold font-urdu" : "text-slate-400 dark:text-slate-500"}>اردو</span>
    </button>
  );
};

export default LanguageSwitcher;
