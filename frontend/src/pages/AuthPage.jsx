import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, registerUser } from '../api/auth'

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

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
    setMessage('')

    try {
      if (isLogin) {
        const response = await loginUser(formData)

        localStorage.setItem('access', response.data.access)
        localStorage.setItem('refresh', response.data.refresh)

        navigate('/dashboard')
      } else {
        await registerUser(formData)
        setMessage('Регистрация успешна. Теперь войдите в систему.')
        setIsLogin(true)
      }
    } catch (err) {
      console.error('Ошибка авторизации:', err)
      setError('Ошибка входа или регистрации.')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <h1>{isLogin ? 'Вход' : 'Регистрация'}</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        <input
          type="text"
          name="username"
          placeholder="Имя пользователя"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      {message && <p style={{ color: 'green', marginTop: '12px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '12px' }}>{error}</p>}

      <p style={{ marginTop: '15px' }}>
        {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
        <button type="button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </p>
    </div>
  )
}

export default AuthPage