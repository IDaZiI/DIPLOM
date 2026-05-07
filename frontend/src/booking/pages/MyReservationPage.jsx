import { useState } from 'react'
import { Link } from 'react-router-dom'
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

const isReservationFinished = (reservation) => {
  if (!reservation || reservation.status !== 'active') {
    return false
  }

  const endTime = formatTime(reservation.end_time)

  if (!reservation.reservation_date || !endTime) {
    return false
  }

  const reservationEnd = new Date(`${reservation.reservation_date}T${endTime}`)

  return reservationEnd < new Date()
}

export default function MyReservationPage() {
  const [formData, setFormData] = useState({
    client_phone: '',
  })

  const [reservations, setReservations] = useState([])
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
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
    setReservations([])
    setSelectedReservation(null)
    setShowCancelModal(false)

    try {
      const data = await lookupReservation({
        client_phone: formData.client_phone.trim(),
      })

      setReservations(Array.isArray(data) ? data : [data])
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось найти бронирование.'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async () => {
    if (!selectedReservation) return

    setCancelling(true)
    setError('')
    setSuccessMessage('')

    try {
      const data = await cancelClientReservation({
        booking_code: selectedReservation.booking_code,
        client_phone: selectedReservation.client_phone,
      })

      setReservations((prev) =>
        prev.map((item) => (item.id === data.id ? data : item))
      )

      setSelectedReservation(null)
      setShowCancelModal(false)
      setSuccessMessage('Бронирование отменено.')
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось отменить бронирование.'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="my-reservation-page">
      <header className="reservation-page-header">
        <div>
          <span className="reservation-page-label">Моё бронирование</span>
          <h1>Найти бронирование</h1>
          <p>
            Введите номер телефона, который был указан при оформлении бронирования.
          </p>
        </div>

        <Link to="/booking" className="btn btn-secondary reservation-back-link">
          Создать бронь
        </Link>
      </header>

      <section className="reservation-lookup-card">
        <div className="reservation-lookup-info">
          <h2>Данные для поиска</h2>
          <p>
            Мы найдём все бронирования, связанные с указанным номером телефона.
          </p>
        </div>

        <form className="reservation-lookup-form reservation-lookup-form-phone" onSubmit={handleSearch}>
          <label>
            Номер телефона
            <input
              type="text"
              value={formData.client_phone}
              onChange={(e) => handleChange('client_phone', e.target.value)}
              placeholder="89999999999"
              required
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary reservation-search-btn"
            disabled={loading || cancelling}
          >
            {loading ? 'Ищем...' : 'Найти бронирования'}
          </button>
        </form>
      </section>

      {error && <p className="booking-message error">{error}</p>}
      {successMessage && <p className="booking-message success">{successMessage}</p>}

      {reservations.length > 0 && (
        <div className="reservation-results-list">
          {reservations.map((reservation) => {
            const reservationFinished = isReservationFinished(reservation)
            const visibleStatus = reservationFinished ? 'finished' : reservation.status

            return (
              <section key={reservation.id} className="reservation-result-card">
                <div className="reservation-result-top">
                  <div>
                    <span className="reservation-result-label">Найдено</span>
                    <h2>Бронирование №{reservation.booking_code}</h2>
                  </div>

                  <span className={`reservation-status ${visibleStatus}`}>
                    {reservationFinished
                      ? 'Завершено'
                      : statusLabels[reservation.status] || reservation.status}
                  </span>
                </div>

                <div className="reservation-details-grid">
                  <div className="reservation-detail">
                    <span>Клиент</span>
                    <strong>{reservation.client_name}</strong>
                  </div>

                  <div className="reservation-detail">
                    <span>Телефон</span>
                    <strong>{reservation.client_phone}</strong>
                  </div>

                  {reservation.client_email && (
                    <div className="reservation-detail">
                      <span>Email</span>
                      <strong>{reservation.client_email}</strong>
                    </div>
                  )}

                  <div className="reservation-detail">
                    <span>Дата</span>
                    <strong>{reservation.reservation_date}</strong>
                  </div>

                  <div className="reservation-detail">
                    <span>Время</span>
                    <strong>
                      {formatTime(reservation.start_time)} – {formatTime(reservation.end_time)}
                    </strong>
                  </div>

                  <div className="reservation-detail">
                    <span>Гостей</span>
                    <strong>{reservation.guest_count}</strong>
                  </div>

                  {reservation.table_details && (
                    <div className="reservation-detail">
                      <span>Столик</span>
                      <strong>
                        №{reservation.table_details.number}, {reservation.table_details.capacity} мест
                      </strong>
                    </div>
                  )}

                  {reservation.comment && (
                    <div className="reservation-detail reservation-detail-wide">
                      <span>Комментарий</span>
                      <strong>{reservation.comment}</strong>
                    </div>
                  )}
                </div>

                {reservation.status === 'active' && !reservationFinished && (
                  <div className="reservation-cancel-box">
                    <div>
                      <h3>Нужно отменить бронь?</h3>
                      <p>После отмены выбранный столик снова станет доступен.</p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        setSelectedReservation(reservation)
                        setShowCancelModal(true)
                      }}
                      disabled={cancelling}
                    >
                      Отменить бронирование
                    </button>
                  </div>
                )}

                {reservation.status === 'cancelled' && (
                  <p className="reservation-note cancelled">
                    Это бронирование уже отменено. Повторная отмена недоступна.
                  </p>
                )}

                {reservationFinished && (
                  <p className="reservation-note finished">
                    Это бронирование уже завершено. Отмена завершённого бронирования недоступна.
                  </p>
                )}
              </section>
            )
          })}
        </div>
      )}

      {showCancelModal && selectedReservation && (
        <div
          className="client-modal-overlay"
          onClick={() => !cancelling && setShowCancelModal(false)}
        >
          <div className="client-modal" onClick={(event) => event.stopPropagation()}>
            <h2>Отменить бронирование?</h2>
            <p>
              Вы уверены, что хотите отменить бронирование №{selectedReservation?.booking_code}?
            </p>

            <div className="client-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Оставить
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleCancelReservation}
                disabled={cancelling}
              >
                {cancelling ? 'Отменяем...' : 'Да, отменить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}