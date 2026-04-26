import { useCallback, useEffect, useState } from 'react'
import {
  createAdminReservation,
  getAdminReservations,
  getTables,
  updateReservation,
} from '../../api/reservations'
import './AdminReservationsPage.css'

const statusLabels = {
  active: 'Активна',
  cancelled: 'Отменено',
}

const formatTime = (value) => value?.slice(0, 5) || ''
const today = new Date().toISOString().split('T')[0]

const initialReservationForm = {
  client_name: '',
  client_phone: '',
  client_email: '',
  guest_count: 1,
  reservation_date: '',
  start_time: '',
  end_time: '',
  table: '',
  comment: '',
  status: 'active',
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [tables, setTables] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    date: '',
    table: '',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    date: '',
    table: '',
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [createFormError, setCreateFormError] = useState('')
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [reservationForm, setReservationForm] = useState(initialReservationForm)

  const loadReservations = useCallback(async (params = {}, { showLoader = true } = {}) => {
    if (showLoader) {
      setLoading(true)
    }

    try {
      const preparedParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '')
      )

      const data = await getAdminReservations(preparedParams)
      setReservations(data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить бронирования.')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }, [])

  const loadTables = useCallback(async () => {
    try {
      const data = await getTables()
      setTables(data)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить список столиков.')
    }
  }, [])

  useEffect(() => {
    loadReservations(appliedFilters)
    loadTables()
  }, [loadReservations, loadTables, appliedFilters])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(filters)
  }

  const handleResetFilters = () => {
    const emptyFilters = {
      status: '',
      date: '',
      table: '',
    }

    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  const handleCreateFormChange = (field, value) => {
  setReservationForm((prev) => ({
    ...prev,
    [field]: value,
  }))
}

  const handleOpenCreateForm = () => {
    setReservationForm(initialReservationForm)
    setIsCreateFormOpen(true)
    setCreateFormError('')
    setError('')
    setSuccessMessage('')
  }

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false)
    setReservationForm(initialReservationForm)
    setCreateFormError('')
  }

  const handleCreateReservation = async (event) => {
    event.preventDefault()

    setCreating(true)
    setCreateFormError('')
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        ...reservationForm,
        guest_count: Number(reservationForm.guest_count),
        table: Number(reservationForm.table),
        status: 'active',
      }

      await createAdminReservation(payload)
      await loadReservations(appliedFilters, { showLoader: false })

      setSuccessMessage('Бронирование успешно создано.')
      setReservationForm(initialReservationForm)
      setIsCreateFormOpen(false)
    } catch (err) {
      console.error(err)

      const backendError = err.response?.data

      if (backendError && typeof backendError === 'object') {
        setCreateFormError('Не удалось создать бронирование. Проверьте дату, время, вместимость и доступность выбранного столика.')
      } else {
        setError('Не удалось создать бронирование.')
      }
    } finally {
      setCreating(false)
    }
  }

const getBackendErrorMessage = (err, fallbackMessage) => {
  const backendError = err.response?.data

  if (Array.isArray(backendError)) {
    return backendError.join(' ')
  }

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
    const messages = Object.values(backendError)
      .flat()
      .filter(Boolean)

    if (messages.length) {
      return messages.join(' ')
    }
  }

  return fallbackMessage
}

  const handleStatusChange = async (reservation, newStatus) => {
    setUpdatingId(reservation.id)
    setError('')
    setSuccessMessage('')

    try {
      await updateReservation(reservation.id, { status: newStatus })
      await loadReservations(appliedFilters, { showLoader: false })

      setSuccessMessage(
        newStatus === 'active'
          ? 'Бронирование восстановлено.'
          : 'Бронирование отменено.'
      )
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось обновить статус бронирования.'
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const stats = {
    all: reservations.length,
    active: reservations.filter((item) => item.status === 'active').length,
    cancelled: reservations.filter((item) => item.status === 'cancelled').length,
  }

  return (
    <div className="admin-reservations-page">
      <h1>Бронирования</h1>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      <div className="reservations-toolbar">
        <div className="reservations-summary-row">
          <div className="reservations-stats">
            <span className="reservations-stat">Всего: {stats.all}</span>
            <span className="reservations-stat active">Активных: {stats.active}</span>
            <span className="reservations-stat cancelled">Отменено: {stats.cancelled}</span>
          </div>

          <button
            type="button"
            className="admin-btn primary"
            onClick={handleOpenCreateForm}
            disabled={loading || creating}
          >
            Создать бронирование
          </button>
        </div>

        <div className="reservations-toolbar-actions">
          <div className="reservations-filter">
            <label htmlFor="statusFilter">Статус</label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Все</option>
              <option value="active">Активна</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>

          <div className="reservations-filter">
            <label htmlFor="dateFilter">Дата</label>
            <input
              id="dateFilter"
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>

          <div className="reservations-filter">
            <label htmlFor="tableFilter">Столик</label>
            <select
              id="tableFilter"
              value={filters.table}
              onChange={(e) => handleFilterChange('table', e.target.value)}
            >
              <option value="">Все</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  №{table.number}, {table.capacity} мест
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="admin-btn primary"
            onClick={handleApplyFilters}
            disabled={loading || updatingId !== null}
          >
            Применить
          </button>

          <button
            type="button"
            className="admin-btn secondary"
            onClick={handleResetFilters}
            disabled={loading || updatingId !== null}
          >
            Сбросить
          </button>

          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => loadReservations(appliedFilters)}
            disabled={loading || updatingId !== null}
          >
            Обновить
          </button>
        </div>
      </div>

      {isCreateFormOpen && (
        <form className="reservation-create-form" onSubmit={handleCreateReservation}>
          <div className="reservation-create-form-header">
            <h2>Создание бронирования</h2>

            <button
              type="button"
              className="admin-btn secondary"
              onClick={handleCloseCreateForm}
              disabled={creating}
            >
              Закрыть
            </button>
          </div>

          {createFormError && (
            <p className="admin-message error reservation-create-form-message">
              {createFormError}
            </p>
          )}

          <div className="reservation-create-form-grid">
            <label>
              Имя клиента
              <input
                type="text"
                value={reservationForm.client_name}
                onChange={(e) => handleCreateFormChange('client_name', e.target.value)}
                required
              />
            </label>

            <label>
              Телефон
              <input
                type="text"
                value={reservationForm.client_phone}
                onChange={(e) => handleCreateFormChange('client_phone', e.target.value)}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={reservationForm.client_email}
                onChange={(e) => handleCreateFormChange('client_email', e.target.value)}
              />
            </label>

            <label>
              Количество гостей
              <input
                type="number"
                min="1"
                value={reservationForm.guest_count}
                onChange={(e) => handleCreateFormChange('guest_count', e.target.value)}
                required
              />
            </label>

            <label>
              Дата
              <input
                type="date"
                min={today}
                value={reservationForm.reservation_date}
                onChange={(e) => handleCreateFormChange('reservation_date', e.target.value)}
                required
              />
            </label>

            <label>
              Время начала
              <input
                type="time"
                value={reservationForm.start_time}
                onChange={(e) => handleCreateFormChange('start_time', e.target.value)}
                required
              />
            </label>

            <label>
              Время окончания
              <input
                type="time"
                value={reservationForm.end_time}
                onChange={(e) => handleCreateFormChange('end_time', e.target.value)}
                required
              />
            </label>

            <label>
              Столик
              <select
                value={reservationForm.table}
                onChange={(e) => handleCreateFormChange('table', e.target.value)}
                required
              >
                <option value="">Выберите столик</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    №{table.number}, {table.capacity} мест
                  </option>
                ))}
              </select>
            </label>

            <label className="reservation-create-form-comment">
              Комментарий
              <textarea
                value={reservationForm.comment}
                onChange={(e) => handleCreateFormChange('comment', e.target.value)}
                rows="3"
              />
            </label>
          </div>

          <div className="reservation-create-form-actions">
            <button
              type="submit"
              className="admin-btn primary"
              disabled={creating}
            >
              {creating ? 'Создание...' : 'Создать'}
            </button>

            <button
              type="button"
              className="admin-btn secondary"
              onClick={handleCloseCreateForm}
              disabled={creating}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="admin-card">
          <p>Загрузка бронирований...</p>
        </div>
      ) : reservations.length ? (
        <div className="reservations-grid">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="reservation-card">
              <p><strong>Клиент:</strong> {reservation.client_name}</p>
              <p><strong>Телефон:</strong> {reservation.client_phone}</p>

              {reservation.client_email && (
                <p><strong>Email:</strong> {reservation.client_email}</p>
              )}

              <p>
                <strong>Столик:</strong>{' '}
                №{reservation.table_details?.number || reservation.table}
                {reservation.table_details?.capacity
                  ? `, ${reservation.table_details.capacity} мест`
                  : ''}
              </p>

              <p><strong>Гостей:</strong> {reservation.guest_count}</p>
              <p><strong>Дата:</strong> {reservation.reservation_date}</p>

              <p>
                <strong>Время:</strong>{' '}
                {formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}
              </p>

              {reservation.comment && (
                <p><strong>Комментарий:</strong> {reservation.comment}</p>
              )}

              <p>
                <strong>Статус:</strong>{' '}
                <span className={`reservation-status ${reservation.status}`}>
                  {statusLabels[reservation.status] || reservation.status}
                </span>
              </p>

              <div className="reservation-actions">
                {reservation.status === 'active' && (
                  <button
                    type="button"
                    className="table-list-btn delete"
                    disabled={updatingId === reservation.id}
                    onClick={() => handleStatusChange(reservation, 'cancelled')}
                  >
                    Отменить
                  </button>
                )}

                {reservation.status === 'cancelled' && (
                  <button
                    type="button"
                    className="admin-btn primary"
                    disabled={updatingId === reservation.id}
                    onClick={() => handleStatusChange(reservation, 'active')}
                  >
                    Восстановить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="admin-card">
          <p>Бронирований по выбранному фильтру нет.</p>
        </div>
      )}
    </div>
  )
}