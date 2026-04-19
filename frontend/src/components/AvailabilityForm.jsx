import { useState } from 'react'
import { createAvailability } from '../api/availability'

function AvailabilityForm() {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    try {
      await createAvailability(formData)

      setMessage('Запись успешно сохранена.')
      setFormData({
        date: '',
        start_time: '',
        end_time: '',
      })
    } catch (err) {
  console.error('Ошибка при сохранении:', err)
  console.error('Ответ сервера:', err.response?.data)

  if (err.response?.data) {
    setError(JSON.stringify(err.response.data))
  } else {
    setError('Не удалось сохранить запись.')
  }
}
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <label>Дата</label>
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />

      <label>Время начала</label>
      <input
        type="time"
        name="start_time"
        value={formData.start_time}
        onChange={handleChange}
        required
      />

      <label>Время конца</label>
      <input
        type="time"
        name="end_time"
        value={formData.end_time}
        onChange={handleChange}
        required
      />

      <button type="submit">Сохранить</button>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}

export default AvailabilityForm