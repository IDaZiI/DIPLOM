import { NavLink, useNavigate } from 'react-router-dom'
import { logoutUser } from '../../utils/auth'
import '../../shared/styles/navbar.css'

function AdminNavbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/auth')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Админ-панель</div>

        <div className="navbar-links">
          <NavLink
            to="/admin/tables"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Столики
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Настройки
          </NavLink>

          <NavLink
            to="/admin/reservations"
            className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            >
            Бронирования
          </NavLink>

          <button className="btn btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  )
}

export default AdminNavbar