import { useCallback, useEffect, useState } from 'react'
import {
  getAdminReservations,
  updateReservation,
} from '../../api/reservations'
import './AdminReservationsPage.css'

const statusLabels = {
  pending: 'Ожидает',
  confirmed: 'Подтверждено',
  cancelled: 'Отменено',
}

const formatTime = (value) => value?.slice(0, 5) || ''

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadReservations = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) {
      setLoading(true)
    }

    try {
      const data = await getAdminReservations()
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

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  const handleStatusChange = async (reservation, newStatus) => {
    setUpdatingId(reservation.id)
    setError('')
    setSuccessMessage('')

    try {
      await updateReservation(reservation.id, { status: newStatus })
      await loadReservations({ showLoader: false })
      setSuccessMessage('Статус бронирования обновлён.')
    } catch (err) {
      console.error(err)
      setError('Не удалось обновить статус бронирования.')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredReservations =
    statusFilter === 'all'
      ? reservations
      : reservations.filter((item) => item.status === statusFilter)

  const stats = {
    all: reservations.length,
    pending: reservations.filter((item) => item.status === 'pending').length,
    confirmed: reservations.filter((item) => item.status === 'confirmed').length,
    cancelled: reservations.filter((item) => item.status === 'cancelled').length,
  }

  return (
    <div className="admin-reservations-page">
      <h1>Бронирования</h1>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      <div className="reservations-toolbar">
        <div className="reservations-stats">
          <span className="reservations-stat">Всего: {stats.all}</span>
          <span className="reservations-stat pending">Ожидает: {stats.pending}</span>
          <span className="reservations-stat confirmed">Подтверждено: {stats.confirmed}</span>
          <span className="reservations-stat cancelled">Отменено: {stats.cancelled}</span>
        </div>

        <div className="reservations-toolbar-actions">
          <div className="reservations-filter">
            <label htmlFor="statusFilter">Фильтр по статусу</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="pending">Ожидает</option>
              <option value="confirmed">Подтверждено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>

          <button
            type="button"
            className="admin-btn secondary"
            onClick={() => loadReservations()}
            disabled={loading || updatingId !== null}
          >
            Обновить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-card">
          <p>Загрузка бронирований...</p>
        </div>
      ) : filteredReservations.length ? (
        <div className="reservations-grid">
          {filteredReservations.map((reservation) => (
            <div key={reservation.id} className="reservation-card">
              <p><strong>Клиент:</strong> {reservation.client_name}</p>
              <p><strong>Телефон:</strong> {reservation.client_phone}</p>

              {reservation.client_email && (
                <p><strong>Email:</strong> {reservation.client_email}</p>
              )}

              <p><strong>Столик:</strong> №{reservation.table}</p>
              <p><strong>Гостей:</strong> {reservation.guest_count}</p>
              <p><strong>Дата:</strong> {reservation.reservation_date}</p>
              <p>
                <strong>Время:</strong> {formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}
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
                <button
                  type="button"
                  className="admin-btn primary"
                  disabled={
                    updatingId === reservation.id ||
                    reservation.status === 'confirmed'
                  }
                  onClick={() => handleStatusChange(reservation, 'confirmed')}
                >
                  Подтвердить
                </button>

                <button
                  type="button"
                  className="admin-btn secondary"
                  disabled={
                    updatingId === reservation.id ||
                    reservation.status === 'pending'
                  }
                  onClick={() => handleStatusChange(reservation, 'pending')}
                >
                  В ожидание
                </button>

                <button
                  type="button"
                  className="table-list-btn delete"
                  disabled={
                    updatingId === reservation.id ||
                    reservation.status === 'cancelled'
                  }
                  onClick={() => handleStatusChange(reservation, 'cancelled')}
                >
                  Отменить
                </button>
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