import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/auth')
  }

  return (
    <nav
      style={{
        display: 'flex',
        gap: '20px',
        padding: '15px 20px',
        backgroundColor: '#f2f2f2',
        borderBottom: '1px solid #ddd',
      }}
    >
      <Link to="/dashboard">Главная</Link>
      <Link to="/availability">Моя доступность</Link>
      <Link to="/records">Мои записи</Link>
      <button onClick={handleLogout}>Выйти</button>
    </nav>
  )
}

export default Navbar