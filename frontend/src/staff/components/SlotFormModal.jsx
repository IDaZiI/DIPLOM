import './SlotFormModal.css'
import { useMemo, useState } from 'react'
import { createAvailability } from '../../api/availability'
import { formatDate } from '../../utils/formatDate'
import { getErrorMessage } from '../../utils/getErrorMessage'

function SlotFormModal({ selectedCell, timeSlots, onClose, onSaved }) {
  const [startTime, setStartTime] = useState(selectedCell?.time ?? '')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableEndTimes = useMemo(() => {
    if (!startTime) return []

    const startIndex = timeSlots.indexOf(startTime)
    if (startIndex === -1) return []

    return timeSlots.slice(startIndex + 1)
  }, [startTime, timeSlots])

  if (!selectedCell) return null

  const handleStartTimeChange = (event) => {
    const newStartTime = event.target.value
    setStartTime(newStartTime)

    if (endTime && endTime <= newStartTime) {
      setEndTime('')
    }
  }

  const handleSave = async () => {
    if (!startTime) {
      setError('Выберите время начала.')
      return
    }

    if (!endTime) {
      setError('Выберите время окончания.')
      return
    }

    if (endTime <= startTime) {
      setError('Время окончания должно быть позже времени начала.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await createAvailability({
        date: selectedCell.date,
        start_time: startTime,
        end_time: endTime,
      })

      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err.response?.data, 'Не удалось сохранить запись.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal slot-modal">
        <h2 className="modal-title">Создание записи</h2>
        <p className="modal-text">{formatDate(selectedCell.date)}</p>

        <div className="form slot-form">
          <div>
            <label>Дата</label>
            <input type="text" value={formatDate(selectedCell.date)} readOnly />
          </div>

          <div className="slot-time-grid">
            <div>
              <label htmlFor="start-time">Время начала</label>
              <select
                id="start-time"
                className="slot-select"
                value={startTime}
                onChange={handleStartTimeChange}
                disabled={isSubmitting}
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="end-time">Время окончания</label>
              <select
                id="end-time"
                className="slot-select"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Выберите время</option>
                {availableEndTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="modal-actions slot-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SlotFormModal