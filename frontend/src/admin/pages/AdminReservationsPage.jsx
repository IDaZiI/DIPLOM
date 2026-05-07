import { useCallback, useEffect, useState } from 'react'
import {
  createAdminReservation,
  getAdminReservations,
  getTables,
  updateReservation,
} from '../../api/reservations'
import './AdminReservationsPage.css'
import AppToast from '../../shared/components/AppToast'

import {
  formatReservationDateTime,
  isReservationFinished,
} from '../../utils/calendar'

const statusLabels = {
  active: 'Активна',
  cancelled: 'Отменена',
  finished: 'Завершена',
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
    search: '',
  })
  const [appliedFilters, setAppliedFilters] = useState({
    status: '',
    date: '',
    table: '',
    search: ''
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [reservationForm, setReservationForm] = useState(initialReservationForm)
  const [editingReservation, setEditingReservation] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

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

  const handleOpenEditForm = (reservation) => {
    setEditingReservation(reservation)
    setReservationForm({
      client_name: reservation.client_name || '',
      client_phone: reservation.client_phone || '',
      client_email: reservation.client_email || '',
      guest_count: reservation.guest_count || 1,
      reservation_date: reservation.reservation_date || '',
      start_time: formatTime(reservation.start_time),
      end_time: formatTime(reservation.end_time),
      table: reservation.table_details?.id || reservation.table || '',
      comment: reservation.comment || '',
      status: reservation.status || 'active',
    })

    setIsCreateFormOpen(false)
    setError('')
    setSuccessMessage('')
  }

  const handleCloseEditForm = () => {
    setEditingReservation(null)
    setReservationForm(initialReservationForm)
  }

  const handleEditReservation = async (event) => {
    event.preventDefault()

    if (!editingReservation) return

    setSavingEdit(true)
    setError('')
    setSuccessMessage('')

    try {
      const payload = {
        ...reservationForm,
        guest_count: Number(reservationForm.guest_count),
        table: Number(reservationForm.table),
      }

      await updateReservation(editingReservation.id, payload)
      await loadReservations(appliedFilters, { showLoader: false })

      setSuccessMessage('Бронирование успешно обновлено.')
      setEditingReservation(null)
      setReservationForm(initialReservationForm)
    } catch (err) {
      console.error(err)
      setError(
        getBackendErrorMessage(
          err,
          'Не удалось обновить бронирование. Проверьте дату, время, вместимость и доступность выбранного столика.'
        )
      )
    } finally {
      setSavingEdit(false)
    }
  }

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

  useEffect(() => {
    if (!error && !successMessage) return

    const timer = setTimeout(() => {
      setError('')
      setSuccessMessage('')
    }, 4000)

    return () => clearTimeout(timer)
  }, [error, successMessage])

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
      search: '',
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
    setEditingReservation(null)
    setError('')
    setSuccessMessage('')
  }

  const handleCloseCreateForm = () => {
    setIsCreateFormOpen(false)
    setReservationForm(initialReservationForm)
  }

  const handleCreateReservation = async (event) => {
    event.preventDefault()

    setCreating(true)
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
      setError(
        getBackendErrorMessage(
          err,
          'Не удалось создать бронирование. Проверьте дату, время, вместимость и доступность выбранного столика.'
        )
      )
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
    active: reservations.filter(
      (item) => item.status === 'active' && !isReservationFinished(item)
    ).length,
    cancelled: reservations.filter((item) => item.status === 'cancelled').length,
    finished: reservations.filter(
      (item) => item.status === 'active' && isReservationFinished(item)
    ).length,
  }

  const tablesForReservationForm = tables.filter((table) => {
    const guestCount = Number(reservationForm.guest_count)

    if (!table.is_active) return false
    if (guestCount && guestCount > table.capacity) return false

    return true
  })

  return (
    <div className="admin-page admin-reservations-page">
      <section className="admin-page-hero">
        <span className="admin-page-badge">Панель администратора</span>

        <h1 className="admin-page-title">Бронирования</h1>

        <p className="admin-page-description">
          Просматривайте бронирования гостей, меняйте их статус и создавайте новые записи.
        </p>
      </section>

      {(error || successMessage) && (
        <div className="admin-toast">
          {error && (
            <div className="admin-toast-message error">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError('')}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          )}

          {successMessage && (
            <div className="admin-toast-message success">
              <span>{successMessage}</span>

              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                aria-label="Закрыть уведомление"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      <div className="reservations-toolbar">
        <div className="reservations-summary-row">
          <div className="reservations-stats">
            <span className="reservations-stat">Всего: {stats.all}</span>
            <span className="reservations-stat active">Активных: {stats.active}</span>
            <span className="reservations-stat cancelled">Отменено: {stats.cancelled}</span>
            <span className="reservations-stat finished"> Завершено: {stats.finished}</span>
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
              <option value="finished">Завершена</option>
            </select>
            <div className="reservations-filter reservations-search-filter">
              <label htmlFor="searchFilter">Клиент или телефон</label>
              <input
                id="searchFilter"
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Анна или 8999"
              />
            </div>
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
              {tablesForReservationForm.map((table) => (
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
            <h2 className="admin-section-title">Создание бронирования</h2>

            <button
              type="button"
              className="admin-btn secondary"
              onClick={handleCloseCreateForm}
              disabled={creating}
            >
              Закрыть
            </button>
          </div>

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

                {tablesForReservationForm.map((table) => (
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

      {editingReservation && (
        <form className="reservation-create-form" onSubmit={handleEditReservation}>
          <div className="reservation-create-form-header">
            <h2 className="admin-section-title">
              Редактирование бронирования
            </h2>

            <button
              type="button"
              className="admin-btn secondary"
              onClick={handleCloseEditForm}
              disabled={savingEdit}
            >
              Закрыть
            </button>
          </div>

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

                {tablesForReservationForm.map((table) => (
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
              disabled={savingEdit}
            >
              {savingEdit ? 'Сохранение...' : 'Сохранить изменения'}
            </button>

            <button
              type="button"
              className="admin-btn secondary"
              onClick={handleCloseEditForm}
              disabled={savingEdit}
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
          {reservations.map((reservation) => {
            const reservationFinished = isReservationFinished(reservation)
            const visibleStatus =
              reservationFinished && reservation.status === 'active'
                ? 'finished'
                : reservation.status

            return (
              <div key={reservation.id} className="reservation-card">
                <div className="reservation-card-header">
                  <div>
                    <h3 className="reservation-card-title">
                      {reservation.client_name}
                    </h3>

                    <p className="reservation-card-subtitle">
                      {formatReservationDateTime(
                        reservation.reservation_date,
                        reservation.start_time,
                        reservation.end_time
                      )}
                    </p>
                  </div>

                  <span className={`reservation-status ${visibleStatus}`}>
                    {statusLabels[visibleStatus] || visibleStatus}
                  </span>
                </div>

                <div className="reservation-card-grid">
                  <div className="reservation-card-item">
                    <span>Телефон</span>
                    <strong>{reservation.client_phone}</strong>
                  </div>

                  {reservation.client_email && (
                    <div className="reservation-card-item">
                      <span>Email</span>
                      <strong>{reservation.client_email}</strong>
                    </div>
                  )}

                  <div className="reservation-card-item">
                    <span>Столик</span>
                    <strong>
                      №{reservation.table_details?.number || reservation.table}
                      {reservation.table_details?.capacity
                        ? `, ${reservation.table_details.capacity} мест`
                        : ''}
                    </strong>
                  </div>

                  <div className="reservation-card-item">
                    <span>Гостей</span>
                    <strong>{reservation.guest_count}</strong>
                  </div>
                </div>

                {reservation.comment && (
                  <div className="reservation-comment">
                    <span>Комментарий</span>
                    <p>{reservation.comment}</p>
                  </div>
                )}

                <div className="reservation-actions">
                  {visibleStatus === 'active' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={updatingId === reservation.id}
                        onClick={() => handleOpenEditForm(reservation)}
                      >
                        Редактировать
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={updatingId === reservation.id}
                        onClick={() => handleStatusChange(reservation, 'cancelled')}
                      >
                        Отменить
                      </button>
                    </>
                  )}

                  {visibleStatus === 'cancelled' && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={updatingId === reservation.id}
                      onClick={() => handleStatusChange(reservation, 'active')}
                    >
                      Восстановить
                    </button>
                  )}

                  {visibleStatus === 'finished' && (
                    <span className="reservation-finished-note">
                      Бронирование завершено
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="admin-card">
          <p>Бронирований по выбранному фильтру нет.</p>
        </div>
      )}
    </div>
  )
}