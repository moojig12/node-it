import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import CategoryDetail from './pages/CategoryDetail.jsx';
import { ToastProvider } from './hooks/ToastProvider.jsx';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories/:id" element={<CategoryDetail />} />
          {/* The standalone /categories list is gone — the persistent left
              rail covers list + create + delete. Bounce old links to the
              canvas at /. */}
          <Route path="/categories" element={<Navigate to="/" replace />} />
          <Route path="/explorer" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
