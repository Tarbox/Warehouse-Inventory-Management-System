"use client";

import { useLocale } from "./LocaleProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-slate-800 p-1">
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={[
          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          locale === "en"
            ? "bg-white text-slate-900"
            : "text-slate-300 hover:text-white",
        ].join(" ")}
        aria-label="Switch to English"
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLocale("cs")}
        className={[
          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          locale === "cs"
            ? "bg-white text-slate-900"
            : "text-slate-300 hover:text-white",
        ].join(" ")}
        aria-label="Přepnout do češtiny"
      >
        CZ
      </button>
    </div>
  );
}