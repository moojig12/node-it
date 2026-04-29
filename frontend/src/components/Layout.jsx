import { NavLink, Outlet } from 'react-router-dom';
import Toasts from './Toasts.jsx';
import CategoryRail from './CategoryRail.jsx';
import { CategoryListProvider } from '../hooks/CategoryListProvider.jsx';
import { CategoryEditProvider } from '../hooks/CategoryEditProvider.jsx';

function Layout() {
  return (
    <CategoryListProvider>
      <CategoryEditProvider>
        <div className="app-shell">
          <header className="app-header">
            <NavLink to="/" className="app-brand" end>
              <span className="brand-dot" aria-hidden="true" />
              <span>Node It</span>
            </NavLink>
          </header>
          <div className="app-body">
            <CategoryRail />
            <main className="app-main">
              <Outlet />
            </main>
          </div>
          <Toasts />
        </div>
      </CategoryEditProvider>
    </CategoryListProvider>
  );
}

export default Layout;
