import { NavLink, Outlet } from 'react-router-dom';
import Toasts from './Toasts.jsx';

function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="app-brand" end>
          <span className="brand-dot" aria-hidden="true" />
          <span>Node It</span>
        </NavLink>
        <nav className="app-nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/categories">Categories</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <Toasts />
    </div>
  );
}

export default Layout;
