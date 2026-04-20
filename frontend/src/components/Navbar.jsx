import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/auth')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">Waiter Module</div>

        <div className="navbar-links">
          <Link to="/availability" className="nav-link">Моя доступность</Link>
          <Link to="/records" className="nav-link">Мои записи</Link>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar