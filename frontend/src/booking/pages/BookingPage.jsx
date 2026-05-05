import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookingSearchForm from '../components/BookingSearchForm'
import AvailableTablesList from '../components/AvailableTablesList'
import ReservationForm from '../components/ReservationForm'
import ClientHallMap from '../components/ClientHallMap'
import {
  getAvailableTables,
  createReservation,
  getTableFeatures,
  getPublicHallScheme,
} from '../../api/reservations'
import './BookingPage.css'

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

export default function BookingPage() {
  const [searchData, setSearchData] = useState(null)
  const [tables, setTables] = useState([])
  const [features, setFeatures] = useState([])
  const [hallScheme, setHallScheme] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [createdReservation, setCreatedReservation] = useState(null)
  const [viewMode, setViewMode] = useState('map')
  const [loading, setLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [featuresData, hallSchemeData] = await Promise.all([
          getTableFeatures(),
          getPublicHallScheme(),
        ])

        setFeatures(featuresData)
        setHallScheme(hallSchemeData)
      } catch (err) {
        console.error(err)
      }
    }

    loadInitialData()
  }, [])

  const handleSearch = async (formData) => {
    setLoading(true)
    setError('')
    setSelectedTable(null)
    setCreatedReservation(null)

    try {
      const searchParams = {
        date: formData.date,
        start_time: formData.start_time,
        guest_count: formData.guest_count,
      }

      const data = await getAvailableTables(searchParams)

      setTables(data)
      setSearchData(formData)
      setViewMode(hallScheme?.image_url ? 'map' : 'list')
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось загрузить доступные столики.'))
      setTables([])
      setSearchData(formData)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTable = (table) => {
    setSelectedTable(table)
    setError('')
    setCreatedReservation(null)
  }

  const handleReservationSubmit = async (reservationData) => {
    setReservationLoading(true)
    setError('')
    setCreatedReservation(null)

    try {
      const created = await createReservation(reservationData)

      setCreatedReservation(created)
      setSelectedTable(null)
      setTables([])
      setSearchData(null)
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось создать бронирование.'))
    } finally {
      setReservationLoading(false)
    }
  }

  return (
    <div className="booking-page">
      <section className="booking-hero">
        <div>
          <span className="booking-kicker">Онлайн-бронирование</span>
          <h1>Забронируйте столик</h1>
          <p>
            Выберите дату и время визита, посмотрите свободные столики на схеме
            зала и оформите бронирование без регистрации.
          </p>
        </div>

        <Link to="/my-reservation" className="btn btn-secondary booking-link-btn">
          Найти моё бронирование
        </Link>
      </section>

      <BookingSearchForm
        onSearch={handleSearch}
        loading={loading}
        features={features}
      />

      {error && <p className="booking-message error">{error}</p>}

      {createdReservation && (
        <section className="booking-success-card">
          <span className="booking-success-icon">✓</span>
          <h2>Бронирование успешно создано</h2>
          <p>Ваш номер бронирования:</p>

          <strong className="booking-code">
            {createdReservation.booking_code}
          </strong>

          <div className="booking-success-details">
            <p>
              <strong>Дата:</strong> {createdReservation.reservation_date}
            </p>

            <p>
              <strong>Время:</strong>{' '}
              {formatTime(createdReservation.start_time)} – {formatTime(createdReservation.end_time)}
            </p>

            <p>
              <strong>Количество гостей:</strong> {createdReservation.guest_count}
            </p>

            <p>
              <strong>Статус:</strong> Активна
            </p>

            {createdReservation.table_details && (
              <p>
                <strong>Столик:</strong>{' '}
                №{createdReservation.table_details.number}, {createdReservation.table_details.capacity} мест
              </p>
            )}
          </div>

          <p className="booking-success-note">
            Сохраните номер бронирования. Он понадобится для просмотра или отмены бронирования.
          </p>

          <Link to="/my-reservation" className="btn btn-primary">
            Перейти к поиску бронирования
          </Link>
        </section>
      )}

      {!createdReservation && searchData && (
        <section className="booking-results">
          <div className="booking-results-header">
            <div>
              <span className="booking-step-badge">Шаг 2</span>
              <h2>Выберите столик</h2>
              <p>
                Дата: <strong>{searchData.date}</strong>, время визита:{' '}
                <strong>{searchData.start_time}</strong>, гостей:{' '}
                <strong>{searchData.guest_count}</strong>
              </p>
            </div>

            {tables.length > 0 && (
              <div className="booking-view-switch">
                <button
                  type="button"
                  className={viewMode === 'map' ? 'active' : ''}
                  onClick={() => setViewMode('map')}
                  disabled={!hallScheme?.image_url}
                >
                  Схема
                </button>

                <button
                  type="button"
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  Список
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="booking-empty-state">
              <h3>Ищем свободные столики...</h3>
              <p>Проверяем доступность на выбранные дату и время.</p>
            </div>
          ) : tables.length > 0 ? (
            <>
              {viewMode === 'map' && (
                <ClientHallMap
                  tables={tables}
                  hallScheme={hallScheme}
                  selectedTableId={selectedTable?.id}
                  selectedFeatureIds={searchData?.features || []}
                  onSelectTable={handleSelectTable}
                />
              )}

              {viewMode === 'list' && (
                <AvailableTablesList
                  tables={tables}
                  selectedTableId={selectedTable?.id}
                  selectedFeatureIds={searchData?.features || []}
                  onSelectTable={handleSelectTable}
                />
              )}
            </>
          ) : (
            <div className="booking-empty-state">
              <h3>Свободные столики не найдены</h3>
              <p>Попробуйте выбрать другое время, дату или изменить пожелания к столику.</p>
            </div>
          )}
        </section>
      )}

      {selectedTable && searchData && !createdReservation && (
        <section className="selected-table-info">
          <div className="selected-table-summary">
            <div>
              <span className="booking-step-badge">Выбранный столик</span>
              <h2>Столик №{selectedTable.number}</h2>
              <p>
                {selectedTable.capacity} мест · {searchData.date} · начало в {searchData.start_time}
              </p>
              <p className="selected-table-note">
                Время окончания бронирования система рассчитает автоматически.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedTable(null)}
            >
              Выбрать другой
            </button>
          </div>

          {selectedTable.features_details?.length > 0 && (
            <div className="feature-tags selected-table-tags">
              {selectedTable.features_details.map((feature) => (
                <span key={feature.id} className="feature-tag">
                  {feature.name}
                </span>
              ))}
            </div>
          )}

          <ReservationForm
            selectedTable={selectedTable}
            searchData={searchData}
            onSubmit={handleReservationSubmit}
            loading={reservationLoading}
          />
        </section>
      )}
    </div>
  )
}