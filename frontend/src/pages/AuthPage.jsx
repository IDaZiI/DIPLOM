import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { setTokens } from '../utils/auth'

function AuthPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await loginUser(formData)

      setTokens(response.data.access, response.data.refresh)

      navigate('/availability')
    } catch (err) {
      console.error('Ошибка входа:', err)
      setError('Неверный логин или пароль.')
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h1 className="auth-title">Вход</h1>
        <p className="auth-text">
          Войдите в систему, используя выданные администратором учетные данные.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <div>
            <label htmlFor="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Введите имя пользователя"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Войти
          </button>
        </form>

        {error && <p className="message-error">{error}</p>}
      </div>
    </div>
  )
}

export default AuthPage