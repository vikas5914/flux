import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DetailsPage from './pages/DetailsPage';
import WatchPage from './pages/WatchPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/title/:id" element={<DetailsPage />} />
      <Route path="/watch/:contentId/:season?/:episode?" element={<WatchPage />} />
    </Routes>
  );
}

export default App
