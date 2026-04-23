import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { logoutUser } from '../utils/auth'

function Layout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/auth')
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <nav className="app-nav">
          <NavLink to="/availability">Доступность</NavLink>
          <NavLink to="/records">Записи</NavLink>
        </nav>

        <button type="button" onClick={handleLogout}>
          Выйти
        </button>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout