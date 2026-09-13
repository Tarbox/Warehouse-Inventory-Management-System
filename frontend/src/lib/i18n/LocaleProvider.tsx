"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  getTranslations,
  type Locale,
  type Translation,
} from "../../lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translation;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const savedLocale = localStorage.getItem("warehouse-inventory-locale");

    if (savedLocale === "en" || savedLocale === "cs") {
      setLocale(savedLocale);
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("warehouse-inventory-locale", locale);
    document.documentElement.lang = locale;

}, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: getTranslations(locale),
    }),
    [locale],
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider");
  }

  return context;
}