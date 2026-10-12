import { useLocale } from "../i18n/LocaleContext";

export function LanguageSwitch() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="lang-switch" aria-label={t("language")}>
      <button
        type="button"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === "ru"}
        onClick={() => setLocale("ru")}
      >
        RU
      </button>
    </div>
  );
}
