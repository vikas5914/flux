import { Navigate, Routes, Route, useParams } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DetailsPage from "./pages/DetailsPage";
import WatchPage from "./pages/WatchPage";
import LegacyMediaRedirect from "./pages/LegacyMediaRedirect";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";

/** Legacy `/search/:type/:query?` → `/browse/:query` (or home). */
function LegacySearchRedirect() {
  const { query } = useParams<{ type?: string; query?: string }>();
  if (query) return <Navigate to={`/browse/${encodeURIComponent(query)}`} replace />;
  return <Navigate to="/browse" replace />;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Legacy sudo-flix browse / search paths */}
        <Route path="/browse/:query?" element={<HomePage />} />
        <Route path="/s/:query" element={<HomePage />} />
        <Route path="/search/:type" element={<LegacySearchRedirect />} />
        <Route path="/search/:type/:query?" element={<LegacySearchRedirect />} />

        <Route path="/title/:id" element={<DetailsPage />} />
        <Route path="/watch/:contentId/:season?/:episode?" element={<WatchPage />} />

        {/* Legacy media URLs — serve content at the same path (no domain hop) */}
        <Route path="/media/:slug" element={<LegacyMediaRedirect />} />
        <Route path="/media/:slug/:season/:episode" element={<LegacyMediaRedirect />} />
      </Routes>
      <PWAUpdatePrompt />
    </>
  );
}

export default App;
