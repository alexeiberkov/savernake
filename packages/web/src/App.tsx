import { Navigate, Route, Routes } from "react-router-dom";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { useLocale } from "./i18n/LocaleContext";
import { LandingPage } from "./pages/LandingPage";
import { RoomPage } from "./pages/RoomPage";

export function App() {
  const { t } = useLocale();
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          {t("brand")}
        </a>
        <LanguageSwitch />
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/r/:code" element={<RoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
