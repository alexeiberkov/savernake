import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type Locale, type MessageKey } from "./messages";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "savernake.locale";

const LOCALES: readonly Locale[] = ["en", "ru", "uk", "be"];

function isLocale(value: string | null): value is Locale {
  return LOCALES.some((locale) => locale === value);
}

function localeFromTag(tag: string): Locale | null {
  const primary = tag.toLowerCase().split("-")[0];
  return isLocale(primary) ? primary : null;
}

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isLocale(stored)) return stored;
  const tags =
    navigator.languages?.length > 0 ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const match = localeFromTag(tag);
    if (match) return match;
  }
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const setLocale = (next: Locale) => {
      localStorage.setItem(STORAGE_KEY, next);
      setLocaleState(next);
    };
    const t = (key: MessageKey) => messages[locale][key] ?? messages.en[key];
    return { locale, setLocale, t };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale outside LocaleProvider");
  return ctx;
}
