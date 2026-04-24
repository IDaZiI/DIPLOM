import { useMemo, useState } from 'react'
import {
  updateAvailability,
  deleteAvailability,
} from '../../api/availability'
import { formatDate } from '../../utils/formatDate'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { formatTime } from '../../utils/formatTime'

function EditSlotModal({ record, timeSlots, onClose, onSaved }) {
  const [startTime, setStartTime] = useState(formatTime(record?.start_time) ?? '')
  const [endTime, setEndTime] = useState(formatTime(record?.end_time) ?? '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const availableEndTimes = useMemo(() => {
    if (!startTime) return []

    const startIndex = timeSlots.indexOf(startTime)
    if (startIndex === -1) return []

    return timeSlots.slice(startIndex + 1)
  }, [startTime, timeSlots])

  if (!record) return null

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
      await updateAvailability(record.id, {
        date: record.date,
        start_time: startTime,
        end_time: endTime,
      })

      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err.response?.data, 'Не удалось обновить запись.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setError('')
    setIsDeleting(true)

    try {
      await deleteAvailability(record.id)
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err.response?.data, 'Не удалось удалить запись.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting && !isDeleting) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal slot-modal">
        <h2 className="modal-title">Редактирование записи</h2>
        <p className="modal-text">{formatDate(record.date)}</p>

        <div className="form slot-form">
          <div>
            <label>Дата</label>
            <input type="text" value={formatDate(record.date)} readOnly />
          </div>

          <div className="slot-time-grid">
            <div>
              <label htmlFor="edit-start-time">Время начала</label>
              <select
                id="edit-start-time"
                className="slot-select"
                value={startTime}
                onChange={handleStartTimeChange}
                disabled={isSubmitting || isDeleting}
              >
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-end-time">Время окончания</label>
              <select
                id="edit-end-time"
                className="slot-select"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isSubmitting || isDeleting}
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
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={isSubmitting || isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </button>

          <div className="slot-modal-right-actions">
            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Отмена
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditSlotModal