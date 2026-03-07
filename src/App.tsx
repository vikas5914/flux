import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DetailsPage from "./pages/DetailsPage";
import WatchPage from "./pages/WatchPage";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/title/:id" element={<DetailsPage />} />
        <Route path="/watch/:contentId/:season?/:episode?" element={<WatchPage />} />
      </Routes>
      <PWAUpdatePrompt />
    </>
  );
}

export default App;
