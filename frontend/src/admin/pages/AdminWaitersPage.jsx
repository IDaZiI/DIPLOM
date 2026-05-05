import { useEffect, useState } from 'react'
import { createWaiter, getWaiters, updateWaiter } from '../../api/availability'
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
  const [updatingId, setUpdatingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadEmployees = async () => {
    setLoading(true)

    try {
      const response = await getWaiters()
      setWaiters(response.data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить список сотрудников.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
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
      setSuccessMessage('Учётная запись сотрудника создана.')
      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось создать учётную запись сотрудника.'
        )
      )
    } finally {
      setCreating(false)
    }
  }

  const handleToggleEmployeeStatus = async (employee) => {
    const newStatus = !employee.is_active

    const confirmed = window.confirm(
      newStatus
        ? 'Активировать учётную запись сотрудника?'
        : 'Деактивировать учётную запись сотрудника?'
    )

    if (!confirmed) {
      return
    }

    setUpdatingId(employee.id)
    setError('')
    setSuccessMessage('')

    try {
      await updateWaiter(employee.id, {
        is_active: newStatus,
      })

      setSuccessMessage(
        newStatus
          ? 'Учётная запись сотрудника активирована.'
          : 'Учётная запись сотрудника деактивирована.'
      )

      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось изменить состояние учётной записи сотрудника.'
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStartEdit = (employee) => {
    setEditingId(employee.id)
    setEditFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
    })
    setError('')
    setSuccessMessage('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({
      first_name: '',
      last_name: '',
      email: '',
    })
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveEmployee = async (employee) => {
    setUpdatingId(employee.id)
    setError('')
    setSuccessMessage('')

    try {
      await updateWaiter(employee.id, editFormData)

      setSuccessMessage('Данные сотрудника обновлены.')
      setEditingId(null)
      setEditFormData({
        first_name: '',
        last_name: '',
        email: '',
      })

      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось обновить данные сотрудника.'
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="admin-waiters-page">
      <div className="admin-waiters-header">
        <div>
          <h1>Сотрудники</h1>
          <p>
            Создание и редактирование учётных записей сотрудников, которые смогут
            входить в систему и указывать свою доступность для работы.
          </p>
        </div>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      <div className="admin-waiters-layout">
        <form className="waiter-form admin-card" onSubmit={handleSubmit}>
          <h2>Новый сотрудник</h2>

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
            {creating ? 'Создание...' : 'Создать сотрудника'}
          </button>
        </form>

        <section className="admin-card waiters-list-card">
          <h2>Список сотрудников</h2>

          {loading ? (
            <p>Загрузка сотрудников...</p>
          ) : waiters.length ? (
            <div className="waiters-list">
              {waiters.map((employee) => {
                const isEditing = editingId === employee.id

                return (
                  <div key={employee.id} className="waiter-item">
                    {isEditing ? (
                      <div className="waiter-edit-form">
                        <label>
                          Имя
                          <input
                            type="text"
                            value={editFormData.first_name}
                            onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                          />
                        </label>

                        <label>
                          Фамилия
                          <input
                            type="text"
                            value={editFormData.last_name}
                            onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                          />
                        </label>

                        <label>
                          Email
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => handleEditFormChange('email', e.target.value)}
                          />
                        </label>

                        <p className="waiter-login-hint">
                          Логин: @{employee.username}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <strong>
                          {employee.first_name || employee.last_name
                            ? `${employee.first_name} ${employee.last_name}`.trim()
                            : employee.username}
                        </strong>

                        <p>@{employee.username}</p>

                        {employee.email && (
                          <p>{employee.email}</p>
                        )}
                      </div>
                    )}

                    <div className="waiter-actions">
                      <span className={`waiter-status ${employee.is_active ? 'active' : 'inactive'}`}>
                        {employee.is_active ? 'Активен' : 'Деактивирован'}
                      </span>

                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn primary"
                            onClick={() => handleSaveEmployee(employee)}
                            disabled={updatingId === employee.id}
                          >
                            Сохранить
                          </button>

                          <button
                            type="button"
                            className="admin-btn secondary"
                            onClick={handleCancelEdit}
                            disabled={updatingId === employee.id}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="admin-btn secondary"
                            onClick={() => handleStartEdit(employee)}
                            disabled={updatingId === employee.id}
                          >
                            Редактировать
                          </button>

                          <button
                            type="button"
                            className={employee.is_active ? 'admin-btn secondary' : 'admin-btn primary'}
                            onClick={() => handleToggleEmployeeStatus(employee)}
                            disabled={updatingId === employee.id}
                          >
                            {employee.is_active ? 'Деактивировать' : 'Активировать'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p>Сотрудники пока не добавлены.</p>
          )}
        </section>
      </div>
    </div>
  )
}