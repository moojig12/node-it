import { Outlet } from 'react-router-dom';
import Toasts from './Toasts.jsx';
import CategoryRail from './CategoryRail.jsx';
import { CategoryListProvider } from '../hooks/CategoryListProvider.jsx';
import { CategoryEditProvider } from '../hooks/CategoryEditProvider.jsx';

function Layout() {
  return (
    <CategoryListProvider>
      <CategoryEditProvider>
        <div className="app-shell">
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
