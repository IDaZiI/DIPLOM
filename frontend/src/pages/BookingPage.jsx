import './BookingPage.css'
import { useState } from 'react'
import BookingSearchForm from '../components/booking/BookingSearchForm'
import AvailableTablesList from '../components/booking/AvailableTablesList'
import ReservationForm from '../components/booking/ReservationForm'
import {
  getAvailableTables,
  createReservation,
} from '../api/reservations'

export default function BookingPage() {
  const [searchData, setSearchData] = useState(null)
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [loading, setLoading] = useState(false)
  const [reservationLoading, setReservationLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSearch = async (formData) => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    setSelectedTable(null)

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
  }

  const handleReservationSubmit = async (reservationData) => {
    setReservationLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      await createReservation(reservationData)
      setSuccessMessage('Бронирование успешно создано.')
      setSelectedTable(null)
      setTables([])
    } catch (err) {
      console.error(err)
      setError('Не удалось создать бронирование.')
    } finally {
      setReservationLoading(false)
    }
  }

  return (
    <div className="booking-page">
      <h1>Бронирование столика</h1>

      <BookingSearchForm onSearch={handleSearch} loading={loading} />

      {error && <p className="booking-message error">{error}</p>}
      {successMessage && <p className="booking-message success">{successMessage}</p>}

      {!loading && tables.length > 0 && (
        <AvailableTablesList
          tables={tables}
          onSelectTable={handleSelectTable}
        />
      )}

      {!loading && searchData && tables.length === 0 && !error && !successMessage && (
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