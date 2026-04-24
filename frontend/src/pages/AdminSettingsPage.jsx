import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutUser } from '../utils/auth'
import {
  getTableFeatures,
  createTableFeature,
  updateTableFeature,
  deleteTableFeature,
} from '../api/reservations'
import './AdminSettingsPage.css'

export default function AdminSettingsPage() {
  const navigate = useNavigate()

  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
  })

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await getTableFeatures()
        setFeatures(data)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить характеристики столиков.')
      } finally {
        setLoading(false)
      }
    }

    loadFeatures()
  }, [])

  const reloadFeatures = async () => {
    try {
      const data = await getTableFeatures()
      setFeatures(data)
    } catch (err) {
      console.error(err)
      setError('Не удалось обновить список характеристик.')
    }
  }

  const handleLogout = () => {
    logoutUser()
    navigate('/auth')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
    })
    setEditingFeature(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (editingFeature) {
        await updateTableFeature(editingFeature.id, formData)
        setSuccessMessage('Характеристика успешно обновлена.')
      } else {
        await createTableFeature(formData)
        setSuccessMessage('Характеристика успешно добавлена.')
      }

      resetForm()
      await reloadFeatures()
    } catch (err) {
      console.error(err)

      const serverError =
        err.response?.data?.name?.[0] ||
        err.response?.data?.detail ||
        'Не удалось сохранить характеристику.'

      setError(serverError)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (feature) => {
    setEditingFeature(feature)
    setFormData({
      name: feature.name,
    })
    setError('')
    setSuccessMessage('')
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Удалить эту характеристику?')
    if (!confirmed) return

    setError('')
    setSuccessMessage('')

    try {
      await deleteTableFeature(id)
      setSuccessMessage('Характеристика успешно удалена.')

      if (editingFeature?.id === id) {
        resetForm()
      }

      await reloadFeatures()
    } catch (err) {
      console.error(err)

      const serverError =
        err.response?.data?.detail ||
        'Не удалось удалить характеристику.'

      setError(serverError)
    }
  }

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <h1>Настройки бронирования</h1>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      <div className="admin-settings-grid">
        <div className="admin-card">
          <form onSubmit={handleSubmit} className="settings-form">
            <h2>
              {editingFeature
                ? 'Редактирование характеристики'
                : 'Добавление характеристики'}
            </h2>

            <div className="settings-form-row">
              <label htmlFor="name">Название</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="settings-form-actions">
              <button type="submit" className="admin-btn primary" disabled={formLoading}>
                {formLoading
                  ? 'Сохранение...'
                  : editingFeature
                    ? 'Сохранить изменения'
                    : 'Добавить характеристику'}
              </button>

              {editingFeature && (
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={resetForm}
                >
                  Отменить редактирование
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h2>Характеристики столиков</h2>

          {loading ? (
            <p>Загрузка...</p>
          ) : features.length ? (
            <div className="settings-feature-list">
              {features.map((feature) => (
                <div key={feature.id} className="settings-feature-card">
                  <div>
                    <p><strong>{feature.name}</strong></p>
                  </div>

                  <div className="settings-feature-actions">
                    <button
                      type="button"
                      className="table-list-btn edit"
                      onClick={() => handleEdit(feature)}
                    >
                      Редактировать
                    </button>

                    <button
                      type="button"
                      className="table-list-btn delete"
                      onClick={() => handleDelete(feature.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Характеристики пока не добавлены.</p>
          )}
        </div>
      </div>

      <div className="admin-card">
        <h2>Будущие настройки</h2>
        <ul className="settings-placeholder-list">
          <li>Лимиты онлайн-бронирования</li>
          <li>Настройки карты зала</li>
          <li>Фон схемы зала</li>
          <li>Дополнительные параметры бронирования</li>
        </ul>
      </div>
    </div>
  )
}