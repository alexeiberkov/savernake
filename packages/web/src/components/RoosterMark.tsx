import { useLocale } from "../i18n/LocaleContext";

/** Original placeholder rooster — not official art. */
export function RoosterMark() {
  const { t } = useLocale();
  return (
    <span className="rooster-mark" title={t("roosterTitle")} aria-label={t("roosterTitle")}>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        aria-hidden
        focusable="false"
      >
        <path
          fill="#d92c2c"
          d="M13.2 3.2c.4 1.6-.2 2.8-1.1 3.7 1.8-.1 3.4.6 4.4 1.8.7.9.9 2 .5 3.1-.5 1.4-1.8 2.3-3.3 2.6v1.4c1.4.3 2.5 1.2 2.9 2.5.3 1.1 0 2.2-.8 3-.9.9-2.2 1.2-3.4.8l-.4 1.6h-2.1l.5-1.9c-1 .1-2-.3-2.7-1.1-.9-1-.9-2.5.1-3.5.5-.5 1.1-.8 1.8-.9V14c-1.7-.5-2.9-1.8-3.1-3.5-.2-1.5.5-2.9 1.7-3.7C8.5 5.6 10.2 4.4 12 3c.4-.3.9-.2 1.2.2z"
        />
        <circle cx="14.2" cy="9.2" r="0.9" fill="#3a1515" />
        <path
          fill="#b51f1f"
          d="M8.2 8.4c-.8.2-1.5.7-1.9 1.4-.2.4.1.8.5.7.9-.2 1.5-.7 1.9-1.4.2-.4-.1-.8-.5-.7z"
        />
      </svg>
    </span>
  );
}
