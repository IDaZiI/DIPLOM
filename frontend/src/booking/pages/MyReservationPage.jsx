import { useState } from 'react'
import {
  lookupReservation,
  cancelClientReservation,
} from '../../api/reservations'
import './MyReservationPage.css'

const statusLabels = {
  active: 'Активна',
  cancelled: 'Отменено',
}

const formatTime = (value) => value?.slice(0, 5) || ''

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
    const messages = Object.values(backendError).flat().filter(Boolean)

    if (messages.length) {
      return messages.join(' ')
    }
  }

  return fallbackMessage
}

export default function MyReservationPage() {
  const [formData, setFormData] = useState({
    booking_code: '',
    client_phone: '',
  })
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSearch = async (event) => {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccessMessage('')
    setReservation(null)

    try {
      const data = await lookupReservation({
        booking_code: formData.booking_code.trim(),
        client_phone: formData.client_phone.trim(),
      })

      setReservation(data)
    } catch (err) {
      console.error(err)
      setError(
        getBackendErrorMessage(
          err,
          'Не удалось найти бронирование.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async () => {
    const confirmed = window.confirm(
      'Вы уверены, что хотите отменить это бронирование?'
    )

    if (!confirmed) {
      return
    }

    setCancelling(true)
    setError('')
    setSuccessMessage('')

    try {
      const data = await cancelClientReservation({
        booking_code: reservation.booking_code,
        client_phone: reservation.client_phone,
      })

      setReservation(data)
      setSuccessMessage('Бронирование отменено.')
    } catch (err) {
      console.error(err)
      setError(
        getBackendErrorMessage(
          err,
          'Не удалось отменить бронирование.'
        )
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="my-reservation-page">
      <h1>Моё бронирование</h1>

      <form className="reservation-lookup-form" onSubmit={handleSearch}>
        <label>
          Номер бронирования
          <input
            type="text"
            value={formData.booking_code}
            onChange={(e) => handleChange('booking_code', e.target.value)}
            placeholder="Например: R-20260427-5A9A24"
            required
          />
        </label>

        <label>
          Номер телефона
          <input
            type="text"
            value={formData.client_phone}
            onChange={(e) => handleChange('client_phone', e.target.value)}
            placeholder="Например: 89999999999"
            required
          />
        </label>

        <button
          type="submit"
          className="client-btn primary"
          disabled={loading || cancelling}
        >
          {loading ? 'Поиск...' : 'Найти бронирование'}
        </button>
      </form>

      {error && <p className="booking-message error">{error}</p>}
      {successMessage && <p className="booking-message success">{successMessage}</p>}

      {reservation && (
        <div className="reservation-result-card">
          <h2>Информация о бронировании</h2>

          <p>
            <strong>Номер бронирования:</strong> {reservation.booking_code}
          </p>

          <p>
            <strong>Клиент:</strong> {reservation.client_name}
          </p>

          <p>
            <strong>Телефон:</strong> {reservation.client_phone}
          </p>

          {reservation.client_email && (
            <p>
              <strong>Email:</strong> {reservation.client_email}
            </p>
          )}

          <p>
            <strong>Дата:</strong> {reservation.reservation_date}
          </p>

          <p>
            <strong>Время:</strong>{' '}
            {formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}
          </p>

          <p>
            <strong>Количество гостей:</strong> {reservation.guest_count}
          </p>

          {reservation.table_details && (
            <p>
              <strong>Столик:</strong>{' '}
              №{reservation.table_details.number}, {reservation.table_details.capacity} мест
            </p>
          )}

          {reservation.comment && (
            <p>
              <strong>Комментарий:</strong> {reservation.comment}
            </p>
          )}

          <p>
            <strong>Статус:</strong>{' '}
            <span className={`reservation-status ${reservation.status}`}>
              {statusLabels[reservation.status] || reservation.status}
            </span>
          </p>

          {reservation.status === 'active' ? (
            <button
              type="button"
              className="client-btn danger"
              onClick={handleCancelReservation}
              disabled={cancelling}
            >
              {cancelling ? 'Отмена...' : 'Отменить бронирование'}
            </button>
          ) : (
            <p className="reservation-cancelled-note">
              Это бронирование уже отменено.
            </p>
          )}
        </div>
      )}
    </div>
  )
}