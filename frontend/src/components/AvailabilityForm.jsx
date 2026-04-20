import { useEffect, useState } from 'react'
import { createAvailability } from '../api/availability'
import { getErrorMessage } from '../utils/getErrorMessage'

function AvailabilityForm() {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
  })

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [showError, setShowError] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!message) return

    const hideTimer = setTimeout(() => {
      setShowMessage(false)
    }, 2500)

    const removeTimer = setTimeout(() => {
      setMessage('')
    }, 2800)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [message])

  useEffect(() => {
    if (!error) return

    const hideTimer = setTimeout(() => {
      setShowError(false)
    }, 3500)

    const removeTimer = setTimeout(() => {
      setError('')
    }, 3800)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [error])

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
    setShowMessage(false)
    setShowError(false)
    setIsSubmitting(true)

    try {
      await createAvailability(formData)

      setShowMessage(true)
      setMessage('Запись успешно сохранена.')
      setFormData({
        date: '',
        start_time: '',
        end_time: '',
      })
    } catch (err) {
      console.error('Ошибка при сохранении:', err)
      const serverData = err.response?.data
      setShowError(true)
      setError(getErrorMessage(serverData, 'Не удалось сохранить запись.'))
    } finally {
      setIsSubmitting(false)
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
          min={today}
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

      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
      </button>

      {message && (
        <div className={`alert alert-success ${!showMessage ? 'alert-hide' : ''}`}>
          {message}
        </div>
      )}

      {error && (
        <div className={`alert alert-error ${!showError ? 'alert-hide' : ''}`}>
          {error}
        </div>
      )}
    </form>
  )
}

export default AvailabilityForm