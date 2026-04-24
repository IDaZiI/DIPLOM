import { useState } from 'react'

export default function BookingSearchForm({ onSearch, loading, features = [] }) {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    guest_count: 1,
    feature: '',
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

    const preparedData = {
      ...formData,
    }

    if (!preparedData.feature) {
      delete preparedData.feature
    }

    onSearch(preparedData)
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

      <div>
        <label htmlFor="feature">Пожелание к столику</label>
        <select
          id="feature"
          name="feature"
          value={formData.feature}
          onChange={handleChange}
        >
          <option value="">Без пожеланий</option>
          {features.map((feature) => (
            <option key={feature.id} value={feature.id}>
              {feature.name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Поиск...' : 'Найти столики'}
      </button>
    </form>
  )
}