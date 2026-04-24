import { NavLink, useNavigate } from 'react-router-dom'
import { clearTokens } from '../../utils/auth'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearTokens()
    navigate('/auth')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Waiter Module</div>

        <div className="navbar-links">
          <NavLink
            to="/availability"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Моя доступность
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
          >
            Мои записи
          </NavLink>

          <button className="btn btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar