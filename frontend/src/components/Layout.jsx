import { NavLink, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <span className="brand-dot" aria-hidden="true" />
          <span>Node It</span>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/explorer">Explorer</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
