import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import CategoriesPage from './pages/Categories.jsx';
import CategoryDetail from './pages/CategoryDetail.jsx';
import { ToastProvider } from './hooks/ToastProvider.jsx';
import './App.css';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:id" element={<CategoryDetail />} />
          {/* Legacy route — the old Explorer page. Bounce to categories list. */}
          <Route path="/explorer" element={<Navigate to="/categories" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
