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

const initialFeatureForm = {
  name: '',
}

const initialBookingSettings = {
  online_booking_enabled: true,
  booking_start_time: '10:00',
  booking_end_time: '22:00',
  reservation_duration_minutes: 120,
  min_time_before_booking_minutes: 60,
  max_days_ahead: 30,
  online_booking_percent: 100,
  reserved_for_walkin_count: 0,
}

const numberFields = [
  'reservation_duration_minutes',
  'min_time_before_booking_minutes',
  'max_days_ahead',
  'online_booking_percent',
  'reserved_for_walkin_count',
]

const getBackendErrorMessage = (err, fallbackMessage) => {
  const backendError = err.response?.data

  if (Array.isArray(backendError)) return backendError.join(' ')
  if (typeof backendError === 'string') return backendError
  if (backendError?.detail) return backendError.detail
  if (backendError?.non_field_errors) return backendError.non_field_errors.join(' ')

  if (backendError && typeof backendError === 'object') {
    const messages = Object.values(backendError).flat().filter(Boolean)
    if (messages.length) return messages.join(' ')
  }

  return fallbackMessage
}

const normalizeBookingSettings = (data) => ({
  online_booking_enabled: data.online_booking_enabled ?? true,
  booking_start_time: data.booking_start_time?.slice(0, 5) ?? '10:00',
  booking_end_time: data.booking_end_time?.slice(0, 5) ?? '22:00',
  reservation_duration_minutes: data.reservation_duration_minutes ?? 120,
  min_time_before_booking_minutes: data.min_time_before_booking_minutes ?? 60,
  max_days_ahead: data.max_days_ahead ?? 30,
  online_booking_percent: data.online_booking_percent ?? 100,
  reserved_for_walkin_count: data.reserved_for_walkin_count ?? 0,
})

export default function AdminSettingsPage() {
  const [features, setFeatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [editingFeature, setEditingFeature] = useState(null)
  const [featureFormData, setFeatureFormData] = useState(initialFeatureForm)
  const [bookingSettings, setBookingSettings] = useState(initialBookingSettings)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [featuresData, settingsData] = await Promise.all([
          getTableFeatures(),
          getBookingSettings(),
        ])

        setFeatures(featuresData)
        setBookingSettings(normalizeBookingSettings(settingsData))
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

  const resetFeatureForm = () => {
    setFeatureFormData(initialFeatureForm)
    setEditingFeature(null)
  }

  const handleFeatureChange = (event) => {
    const { name, value } = event.target

    setFeatureFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSettingsChange = (event) => {
    const { name, value, type, checked } = event.target

    setBookingSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : numberFields.includes(name)
          ? Number(value)
          : value,
    }))
  }

  const handleFeatureSubmit = async (event) => {
    event.preventDefault()

    setFormLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (editingFeature) {
        await updateTableFeature(editingFeature.id, featureFormData)
        setSuccessMessage('Характеристика успешно обновлена.')
      } else {
        await createTableFeature(featureFormData)
        setSuccessMessage('Характеристика успешно добавлена.')
      }

      resetFeatureForm()
      await reloadFeatures()
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось сохранить характеристику.'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditFeature = (feature) => {
    setEditingFeature(feature)
    setFeatureFormData({
      name: feature.name,
    })
    setError('')
    setSuccessMessage('')
  }

  const handleDeleteFeature = async (id) => {
    const confirmed = window.confirm('Удалить эту характеристику?')

    if (!confirmed) return

    setError('')
    setSuccessMessage('')

    try {
      await deleteTableFeature(id)
      setSuccessMessage('Характеристика успешно удалена.')

      if (editingFeature?.id === id) {
        resetFeatureForm()
      }

      await reloadFeatures()
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось удалить характеристику.'))
    }
  }

  const handleSettingsSubmit = async (event) => {
    event.preventDefault()

    setSettingsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        ...bookingSettings,
        reservation_duration_minutes: Number(bookingSettings.reservation_duration_minutes),
        min_time_before_booking_minutes: Number(bookingSettings.min_time_before_booking_minutes),
        max_days_ahead: Number(bookingSettings.max_days_ahead),
        online_booking_percent: Number(bookingSettings.online_booking_percent),
        reserved_for_walkin_count: Number(bookingSettings.reserved_for_walkin_count),
      }

      const updated = await updateBookingSettings(payload)
      setBookingSettings(normalizeBookingSettings(updated))
      setSuccessMessage('Настройки онлайн-бронирования сохранены.')
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось сохранить настройки бронирования.'))
    } finally {
      setSettingsLoading(false)
    }
  }

  return (
    <div className="admin-settings-page">
      <div className="settings-hero">
        <div>
          <h1>Настройки бронирования</h1>
          <p>
            Управляйте правилами онлайн-бронирования, ограничениями доступности
            столиков и характеристиками, которые видит клиент.
          </p>
        </div>

        <div className={`settings-status ${bookingSettings.online_booking_enabled ? 'active' : 'disabled'}`}>
          <span className="settings-status-dot" />
          {bookingSettings.online_booking_enabled
            ? 'Онлайн-бронирование включено'
            : 'Онлайн-бронирование отключено'}
        </div>
      </div>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <p className="settings-sidebar-title">Разделы</p>

          <a href="#online-status">Онлайн-бронирование</a>
          <a href="#booking-time">Время бронирования</a>
          <a href="#booking-limits">Ограничения</a>
          <a href="#table-features">Характеристики</a>
        </aside>

        <div className="settings-content">
          <form onSubmit={handleSettingsSubmit} className="booking-settings-form">
            <section id="online-status" className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Онлайн-бронирование</h2>
                  <p>
                    Основной переключатель. Если онлайн-бронирование отключено,
                    клиент не сможет создать бронь через сайт.
                  </p>
                </div>
              </div>

              <label className="settings-toggle-card">
                <input
                  type="checkbox"
                  name="online_booking_enabled"
                  checked={bookingSettings.online_booking_enabled}
                  onChange={handleSettingsChange}
                />

                <span className="settings-toggle-visual" />

                <span>
                  <strong>Разрешить онлайн-бронирование</strong>
                  <small>
                    При отключении клиентская форма бронирования будет недоступна.
                  </small>
                </span>
              </label>
            </section>

            <section id="booking-time" className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Время бронирования</h2>
                  <p>
                    Эти параметры определяют допустимое время бронирования и длительность
                    брони, которую система рассчитывает автоматически.
                  </p>
                </div>
              </div>

              <div className="settings-fields-grid">
                <label>
                  Начало интервала
                  <input
                    type="time"
                    name="booking_start_time"
                    value={bookingSettings.booking_start_time}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>

                <label>
                  Конец интервала
                  <input
                    type="time"
                    name="booking_end_time"
                    value={bookingSettings.booking_end_time}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>

                <label>
                  Длительность брони, минут
                  <input
                    type="number"
                    name="reservation_duration_minutes"
                    min="15"
                    step="15"
                    value={bookingSettings.reservation_duration_minutes}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>

                <label>
                  Минимум до начала, минут
                  <input
                    type="number"
                    name="min_time_before_booking_minutes"
                    min="0"
                    step="15"
                    value={bookingSettings.min_time_before_booking_minutes}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>

                <label>
                  Максимум дней вперёд
                  <input
                    type="number"
                    name="max_days_ahead"
                    min="1"
                    value={bookingSettings.max_days_ahead}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>
              </div>
            </section>

            <section id="booking-limits" className="settings-card">
              <div className="settings-card-header">
                <div>
                  <h2>Ограничения онлайн-бронирования</h2>
                  <p>
                    Ограничьте количество столиков, которые могут быть доступны
                    клиентам через онлайн-бронирование.
                  </p>
                </div>
              </div>

              <div className="settings-fields-grid">
                <label>
                  Доля столиков онлайн, %
                  <input
                    type="number"
                    name="online_booking_percent"
                    min="0"
                    max="100"
                    value={bookingSettings.online_booking_percent}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>

                <label>
                  Столиков для живой посадки
                  <input
                    type="number"
                    name="reserved_for_walkin_count"
                    min="0"
                    value={bookingSettings.reserved_for_walkin_count}
                    onChange={handleSettingsChange}
                    required
                  />
                </label>
              </div>

              <div className="settings-note">
                Например: если в системе 10 активных столиков, доля онлайн-бронирования
                равна 70%, а для живой посадки сохранено 2 столика, система ограничит
                количество столиков, доступных клиентам онлайн.
              </div>

              <div className="settings-save-bar">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={settingsLoading}
                >
                  {settingsLoading ? 'Сохранение...' : 'Сохранить настройки'}
                </button>
              </div>
            </section>
          </form>

          <section id="table-features" className="settings-card">
            <div className="settings-card-header">
              <div>
                <h2>Характеристики столиков</h2>
                <p>
                  Эти характеристики используются клиентом при поиске подходящего столика:
                  у окна, тихое место, терраса и другие пожелания.
                </p>
              </div>
            </div>

            <div className="features-layout">
              <form onSubmit={handleFeatureSubmit} className="feature-form">
                <h3>
                  {editingFeature
                    ? 'Редактирование характеристики'
                    : 'Новая характеристика'}
                </h3>

                <label>
                  Название
                  <input
                    type="text"
                    name="name"
                    value={featureFormData.name}
                    onChange={handleFeatureChange}
                    placeholder="Например: У окна"
                    required
                  />
                </label>

                <div className="feature-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading
                      ? 'Сохранение...'
                      : editingFeature
                        ? 'Сохранить'
                        : 'Добавить'}
                  </button>

                  {editingFeature && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={resetFeatureForm}
                      disabled={formLoading}
                    >
                      Отмена
                    </button>
                  )}
                </div>
              </form>

              <div className="features-list-panel">
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
                            className="btn btn-secondary"
                            onClick={() => handleEditFeature(feature)}
                          >
                            Редактировать
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeleteFeature(feature.id)}
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
          </section>
        </div>
      </div>
    </div>
  )
}