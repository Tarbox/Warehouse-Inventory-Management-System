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
  const [locale, setLocale] =
    useState<Locale>("en");

  const [hydrated, setHydrated] =
    useState(false);

  useEffect(() => {
    const savedLocale =
      localStorage.getItem(
        "warehouse-inventory-locale",
      );

    const initialLocale: Locale =
      savedLocale === "cs" ||
      savedLocale === "en"
        ? savedLocale
        : "en";

    setLocale(initialLocale);
    document.documentElement.lang =
      initialLocale;

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    localStorage.setItem(
      "warehouse-inventory-locale",
      locale,
    );

    document.documentElement.lang =
      locale;
  }, [locale, hydrated]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: getTranslations(locale),
    }),
    [locale],
  );

  if (!hydrated) {
    return (
      <div
        className="min-h-screen"
        aria-hidden="true"
      />
    );
  }

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