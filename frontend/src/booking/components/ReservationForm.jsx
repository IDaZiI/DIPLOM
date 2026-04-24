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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      table: selectedTable.id,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      client_email: formData.client_email,
      guest_count: Number(searchData.guest_count),
      reservation_date: searchData.date,
      start_time: `${searchData.start_time}:00`,
      end_time: `${searchData.end_time}:00`,
      comment: formData.comment,
      status: 'pending',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Данные для бронирования</h2>

      <div>
        <label htmlFor="client_name">Имя</label>
        <input
          id="client_name"
          type="text"
          name="client_name"
          value={formData.client_name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="client_phone">Телефон</label>
        <input
          id="client_phone"
          type="text"
          name="client_phone"
          value={formData.client_phone}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="client_email">Email</label>
        <input
          id="client_email"
          type="email"
          name="client_email"
          value={formData.client_email}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="comment">Комментарий</label>
        <textarea
          id="comment"
          name="comment"
          value={formData.comment}
          onChange={handleChange}
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Отправка...' : 'Подтвердить бронь'}
      </button>
    </form>
  )
}