import { useState } from 'react'

export default function BookingSearchForm({ onSearch, loading }) {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    guest_count: 1,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="booking-search-form">
      <div>
        <label htmlFor="date">Дата</label>
        <input
          id="date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="start_time">Время начала</label>
        <input
          id="start_time"
          type="time"
          name="start_time"
          value={formData.start_time}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="end_time">Время окончания</label>
        <input
          id="end_time"
          type="time"
          name="end_time"
          value={formData.end_time}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="guest_count">Количество гостей</label>
        <input
          id="guest_count"
          type="number"
          name="guest_count"
          min="1"
          value={formData.guest_count}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Поиск...' : 'Найти столики'}
      </button>
    </form>
  )
}