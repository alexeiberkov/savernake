import { useLocale } from "../i18n/LocaleContext";
import type { Locale } from "../i18n/messages";

const OPTIONS: { locale: Locale; label: string; name: string }[] = [
  { locale: "en", label: "EN", name: "English" },
  { locale: "ru", label: "RU", name: "Русский" },
  { locale: "uk", label: "UK", name: "Українська" },
  { locale: "be", label: "BE", name: "Беларуская" },
];

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="lang-switch" aria-label={t("language")}>
      {OPTIONS.map((option) => (
        <button
          key={option.locale}
          type="button"
          aria-pressed={locale === option.locale}
          title={option.name}
          onClick={() => setLocale(option.locale)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
