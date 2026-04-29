import { useEffect, useState } from 'react'
import { createWaiter, getWaiters } from '../../api/availability'
import './AdminWaitersPage.css'

const initialForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password2: '',
}

const getBackendErrorMessage = (err, fallbackMessage) => {
  const backendError = err.response?.data

  if (typeof backendError === 'string') {
    return backendError
  }

  if (backendError?.detail) {
    return backendError.detail
  }

  if (backendError?.non_field_errors) {
    return backendError.non_field_errors.join(' ')
  }

  if (backendError && typeof backendError === 'object') {
    const messages = Object.entries(backendError)
      .flatMap(([field, value]) => {
        const text = Array.isArray(value) ? value.join(' ') : value
        return `${field}: ${text}`
      })
      .filter(Boolean)

    if (messages.length) {
      return messages.join(' ')
    }
  }

  return fallbackMessage
}

export default function AdminWaitersPage() {
  const [waiters, setWaiters] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadWaiters = async () => {
    setLoading(true)

    try {
      const response = await getWaiters()
      setWaiters(response.data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить список официантов.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWaiters()
  }, [])

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setCreating(true)
    setError('')
    setSuccessMessage('')

    try {
      await createWaiter(formData)
      setFormData(initialForm)
      setSuccessMessage('Учётная запись официанта создана.')
      await loadWaiters()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось создать учётную запись официанта.'
        )
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="admin-waiters-page">
      <div className="admin-waiters-header">
        <div>
          <h1>Официанты</h1>
          <p>
            Создание учётных записей сотрудников, которые смогут входить в систему
            и указывать свою доступность.
          </p>
        </div>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      <div className="admin-waiters-layout">
        <form className="waiter-form admin-card" onSubmit={handleSubmit}>
          <h2>Новый официант</h2>

          <label>
            Логин
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              required
            />
          </label>

          <label>
            Имя
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
            />
          </label>

          <label>
            Фамилия
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required
            />
          </label>

          <label>
            Повторите пароль
            <input
              type="password"
              value={formData.password2}
              onChange={(e) => handleChange('password2', e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="admin-btn primary"
            disabled={creating}
          >
            {creating ? 'Создание...' : 'Создать официанта'}
          </button>
        </form>

        <section className="admin-card waiters-list-card">
          <h2>Список официантов</h2>

          {loading ? (
            <p>Загрузка официантов...</p>
          ) : waiters.length ? (
            <div className="waiters-list">
              {waiters.map((waiter) => (
                <div key={waiter.id} className="waiter-item">
                  <div>
                    <strong>
                      {waiter.first_name || waiter.last_name
                        ? `${waiter.first_name} ${waiter.last_name}`.trim()
                        : waiter.username}
                    </strong>

                    <p>@{waiter.username}</p>

                    {waiter.email && (
                      <p>{waiter.email}</p>
                    )}
                  </div>

                  <span className="waiter-role">Официант</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Официанты пока не добавлены.</p>
          )}
        </section>
      </div>
    </div>
  )
}