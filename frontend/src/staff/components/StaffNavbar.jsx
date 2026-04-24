import { NavLink, useNavigate } from 'react-router-dom'
import { logoutUser } from '../../utils/auth'
import '../../shared/styles/navbar.css'

function StaffNavbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate('/auth')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Модуль официанта</div>

        <div className="navbar-links">
          <NavLink
            to="/availability"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Доступность
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Записи
          </NavLink>

          <button className="btn btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  )
}

export default StaffNavbar