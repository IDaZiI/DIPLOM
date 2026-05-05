import { useState } from 'react'

export default function ReservationForm({
  selectedTable,
  searchData,
  onSubmit,
  loading,
}) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    comment: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    onSubmit({
      table: selectedTable.id,
      client_name: formData.client_name.trim(),
      client_phone: formData.client_phone.trim(),
      client_email: formData.client_email.trim(),
      guest_count: Number(searchData.guest_count),
      reservation_date: searchData.date,
      start_time: `${searchData.start_time}:00`,
      comment: formData.comment.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="reservation-form">
      <div className="booking-search-intro">
        <span className="booking-step-badge">Шаг 3</span>
        <div>
          <h2>Контактные данные</h2>
          <p>Укажите данные, чтобы ресторан мог связаться с вами при необходимости.</p>
        </div>
      </div>

      <div className="reservation-form-grid">
        <label>
          Имя
          <input
            type="text"
            name="client_name"
            value={formData.client_name}
            onChange={handleChange}
            placeholder="Например: Анна"
            required
          />
        </label>

        <label>
          Телефон
          <input
            type="tel"
            name="client_phone"
            value={formData.client_phone}
            onChange={handleChange}
            placeholder="Например: 89999999999"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="client_email"
            value={formData.client_email}
            onChange={handleChange}
            placeholder="name@example.com"
          />
        </label>

        <label className="reservation-comment-field">
          Комментарий
          <textarea
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            placeholder="Например: детский стул, день рождения, особые пожелания"
          />
        </label>
      </div>

      <button type="submit" className="btn btn-primary reservation-submit-btn" disabled={loading}>
        {loading ? 'Создаём бронирование...' : 'Подтвердить бронирование'}
      </button>
    </form>
  )
}