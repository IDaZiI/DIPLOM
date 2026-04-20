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

  const getErrorMessage = (data) => {
    if (!data) {
      return 'Не удалось сохранить запись.'
    }

    if (typeof data === 'string') {
      return data
    }

    if (data.non_field_errors?.length) {
      return data.non_field_errors[0]
    }

    if (data.detail) {
      return data.detail
    }

    const firstKey = Object.keys(data)[0]
    if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
      return data[firstKey][0]
    }

    return 'Не удалось сохранить запись.'
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
      const serverData = err.response?.data
      setError(getErrorMessage(serverData))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
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
        <label htmlFor="end_time">Время конца</label>
        <input
          id="end_time"
          type="time"
          name="end_time"
          value={formData.end_time}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Сохранить
      </button>

      {message && <p className="message-success">{message}</p>}
      {error && <p className="message-error">{error}</p>}
    </form>
  )
}

export default AvailabilityForm