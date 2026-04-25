import { useEffect, useState } from 'react'
import {
  getTableFeatures,
  createTableFeature,
  updateTableFeature,
  deleteTableFeature,
  getBookingSettings,
  updateBookingSettings,
} from '../../api/reservations'
import './AdminSettingsPage.css'

export default function AdminSettingsPage() {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [formData, setFormData] = useState({
    name: '',
  })

  const [bookingSettings, setBookingSettings] = useState({
    online_booking_enabled: true,
    online_booking_percent: 100,
    reserved_for_walkin_count: 0,
  })

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [featuresData, settingsData] = await Promise.all([
          getTableFeatures(),
          getBookingSettings(),
        ])

        setFeatures(featuresData)
        setBookingSettings(settingsData)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить настройки.')
      } finally {
        setLoading(false)
      }
    }

    loadPageData()
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

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target

    setBookingSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value),
    }))
  }

  const resetForm = () => {
    setFormData({ name: '' })
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

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    setSettingsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const updated = await updateBookingSettings(bookingSettings)
      setBookingSettings(updated)
      setSuccessMessage('Настройки онлайн-бронирования сохранены.')
    } catch (err) {
      console.error(err)

      const serverError =
        err.response?.data?.online_booking_percent?.[0] ||
        err.response?.data?.reserved_for_walkin_count?.[0] ||
        err.response?.data?.detail ||
        'Не удалось сохранить настройки бронирования.'

      setError(serverError)
    } finally {
      setSettingsLoading(false)
    }
  }

  return (
    <div className="admin-settings-page">
      <h1>Настройки бронирования</h1>

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
                    <p className="feature-slug">{feature.slug}</p>
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
        <form onSubmit={handleSettingsSubmit} className="settings-form">
          <h2>Онлайн-бронирование</h2>

          <label className="settings-checkbox">
            <input
              type="checkbox"
              name="online_booking_enabled"
              checked={bookingSettings.online_booking_enabled}
              onChange={handleSettingsChange}
            />
            Онлайн-бронирование включено
          </label>

          <div className="settings-form-row">
            <label htmlFor="online_booking_percent">
              Процент столиков, доступных онлайн
            </label>
            <input
              id="online_booking_percent"
              type="number"
              name="online_booking_percent"
              min="0"
              max="100"
              value={bookingSettings.online_booking_percent}
              onChange={handleSettingsChange}
            />
          </div>

          <div className="settings-form-row">
            <label htmlFor="reserved_for_walkin_count">
              Сколько столиков оставить для живой посадки
            </label>
            <input
              id="reserved_for_walkin_count"
              type="number"
              name="reserved_for_walkin_count"
              min="0"
              value={bookingSettings.reserved_for_walkin_count}
              onChange={handleSettingsChange}
            />
          </div>

          <div className="settings-form-note">
            Эти настройки ограничивают количество столиков, которые можно отдать в онлайн-бронирование.
          </div>

          <div className="settings-form-actions">
            <button
              type="submit"
              className="admin-btn primary"
              disabled={settingsLoading}
            >
              {settingsLoading ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}