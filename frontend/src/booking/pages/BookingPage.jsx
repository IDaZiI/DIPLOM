import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookingSearchForm from '../components/BookingSearchForm'
import AvailableTablesList from '../components/AvailableTablesList'
import ReservationForm from '../components/ReservationForm'
import {
  getAvailableTables,
  createReservation,
  getTableFeatures,
} from '../../api/reservations'
import './BookingPage.css'

const formatTime = (value) => value?.slice(0, 5) || ''

export default function BookingPage() {
  const [searchData, setSearchData] = useState(null)
  const [tables, setTables] = useState([])
  const [features, setFeatures] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [createdReservation, setCreatedReservation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await getTableFeatures()
        setFeatures(data)
      } catch (err) {
        console.error(err)
      }
    }

    loadFeatures()
  }, [])

  const handleSearch = async (formData) => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    setSelectedTable(null)
    setCreatedReservation(null)

    try {
      const data = await getAvailableTables(formData)
      setTables(data)
      setSearchData(formData)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить доступные столики.')
      setTables([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTable = (table) => {
    setSelectedTable(table)
    setSuccessMessage('')
    setError('')
    setCreatedReservation(null)
  }

  const handleReservationSubmit = async (reservationData) => {
    setReservationLoading(true)
    setError('')
    setSuccessMessage('')
    setCreatedReservation(null)

    try {
      const created = await createReservation(reservationData)

      setCreatedReservation(created)
      setSuccessMessage('Бронирование успешно создано.')
      setSelectedTable(null)
      setTables([])
      setSearchData(null)
    } catch (err) {
      console.error(err)
      setError('Не удалось создать бронирование.')
    } finally {
      setReservationLoading(false)
    }
  }

  return (
    <div className="booking-page">
      <div className="booking-page-header">
        <h1>Бронирование столика</h1>

        <Link to="/my-reservation" className="btn-primary booking-link-btn">
          Найти моё бронирование
        </Link>
      </div>

      <BookingSearchForm
        onSearch={handleSearch}
        loading={loading}
        features={features}
      />

      {error && <p className="booking-message error">{error}</p>}

      {createdReservation ? (
        <div className="booking-success-card">
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
        </div>
      ) : (
        successMessage && <p className="booking-message success">{successMessage}</p>
      )}

      {!loading && tables.length > 0 && (
        <AvailableTablesList
          tables={tables}
          onSelectTable={handleSelectTable}
        />
      )}

      {!loading && searchData && tables.length === 0 && !error && !successMessage && !createdReservation && (
        <p>Свободные столики не найдены.</p>
      )}

      {selectedTable && searchData && (
        <div className="selected-table-info">
          <h2>Выбранный столик</h2>
          <p><strong>Номер:</strong> {selectedTable.number}</p>
          <p><strong>Вместимость:</strong> {selectedTable.capacity}</p>
          <p><strong>Дата:</strong> {searchData.date}</p>
          <p><strong>Время:</strong> {searchData.start_time} - {searchData.end_time}</p>
          <p><strong>Гостей:</strong> {searchData.guest_count}</p>

          {selectedTable.features_details?.length > 0 && (
            <div className="selected-table-features">
              <strong>Особенности:</strong>
              <div className="feature-tags">
                {selectedTable.features_details.map((feature) => (
                  <span key={feature.id} className="feature-tag">
                    {feature.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ReservationForm
            selectedTable={selectedTable}
            searchData={searchData}
            onSubmit={handleReservationSubmit}
            loading={reservationLoading}
          />
        </div>
      )}
    </div>
  )
}