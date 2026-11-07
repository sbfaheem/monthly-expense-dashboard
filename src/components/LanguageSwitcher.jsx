import React from "react";
import { useLanguage } from "../context/LanguageContext";

export const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className="inline-flex items-center gap-1 px-1.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-200 select-none"
    >
      <span className="text-sm px-1 select-none leading-none">🌐</span>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer font-bold ${
          lang === "en"
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
        title="Switch to English (?lang=en)"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLang("ur")}
        aria-pressed={lang === "ur"}
        className={`px-2 py-0.5 rounded-full transition-all cursor-pointer font-bold font-urdu ${
          lang === "ur"
            ? "bg-emerald-600 text-white shadow-xs"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
        title="اردو میں تبدیل کریں (?lang=ur)"
      >
        اردو
      </button>
    </div>
  );
};

export default LanguageSwitcher;
