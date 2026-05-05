import { useEffect, useMemo, useState } from 'react'
import {
  getAvailabilities,
  deleteAvailability,
  updateAvailability,
} from '../../api/availability'
import ConfirmModal from './ConfirmModal'
import { formatDate } from '../../utils/formatDate'
import { formatTime } from '../../utils/formatTime'
import { getErrorMessage } from '../../utils/getErrorMessage'

const getTodayISO = () => {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localDate.toISOString().split('T')[0]
}

const getDurationText = (startTime, endTime) => {
  const [startHours, startMinutes] = formatTime(startTime).split(':').map(Number)
  const [endHours, endMinutes] = formatTime(endTime).split(':').map(Number)

  const startTotal = startHours * 60 + startMinutes
  const endTotal = endHours * 60 + endMinutes
  const duration = Math.max(0, endTotal - startTotal)

  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  if (hours && minutes) {
    return `${hours} ч ${minutes} мин`
  }

  if (hours) {
    return `${hours} ч`
  }

  return `${minutes} мин`
}

function AvailabilityList() {
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState('upcoming')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [actionError, setActionError] = useState('')
  const [showActionError, setShowActionError] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
  })

  const [recordToDelete, setRecordToDelete] = useState(null)
  const today = getTodayISO()
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!actionError) return

    const hideTimer = setTimeout(() => {
      setShowActionError(false)
    }, 3500)

    const removeTimer = setTimeout(() => {
      setActionError('')
    }, 3800)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [actionError])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAvailabilities()

        const sortedRecords = [...response.data].sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date)
          }

          return formatTime(a.start_time).localeCompare(formatTime(b.start_time))
        })

        setRecords(sortedRecords)
      } catch (err) {
        console.error('Ошибка при загрузке записей:', err)
        setError('Не удалось загрузить записи.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const upcomingRecords = useMemo(
    () => records.filter((record) => record.date >= today),
    [records, today]
  )

  const pastRecords = useMemo(
    () => records.filter((record) => record.date < today),
    [records, today]
  )

  const visibleRecords = filter === 'upcoming' ? upcomingRecords : pastRecords

  const openDeleteModal = (record) => {
    if (record.date < today) {
      return
    }

    setActionError('')
    setShowActionError(false)
    setRecordToDelete(record)
  }

  const closeDeleteModal = () => {
    setRecordToDelete(null)
  }

  const confirmDelete = async () => {
    if (!recordToDelete) {
      return
    }

    setActionError('')
    setShowActionError(false)
    setIsDeleting(true)

    try {
      await deleteAvailability(recordToDelete.id)
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== recordToDelete.id)
      )
      setRecordToDelete(null)
    } catch (err) {
      console.error('Ошибка при удалении записи:', err)
      setShowActionError(true)
      setActionError(getErrorMessage(err.response?.data))
      setRecordToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditClick = (record) => {
    if (record.date < today) {
      return
    }

    setActionError('')
    setShowActionError(false)
    setEditingId(record.id)
    setEditForm({
      date: record.date,
      start_time: formatTime(record.start_time),
      end_time: formatTime(record.end_time),
    })
  }

  const handleEditChange = (event) => {
    setEditForm({
      ...editForm,
      [event.target.name]: event.target.value,
    })
  }

  const handleEditSave = async (id) => {
    setActionError('')
    setShowActionError(false)
    setIsSavingEdit(true)

    try {
      const response = await updateAvailability(id, editForm)

      setRecords((currentRecords) =>
        currentRecords.map((record) =>
          record.id === id ? response.data : record
        )
      )

      setEditingId(null)
      setEditForm({
        date: '',
        start_time: '',
        end_time: '',
      })
    } catch (err) {
      console.error('Ошибка при редактировании записи:', err)
      setShowActionError(true)
      setActionError(getErrorMessage(err.response?.data))
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleEditCancel = () => {
    setActionError('')
    setShowActionError(false)
    setEditingId(null)
    setEditForm({
      date: '',
      start_time: '',
      end_time: '',
    })
  }

  if (loading) {
    return (
      <div className="records-state-card">
        <h2>Загрузка записей...</h2>
        <p>Получаем ваши интервалы доступности.</p>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  if (records.length === 0) {
    return (
      <div className="records-state-card">
        <h2>Пока нет записей</h2>
        <p>
          У вас ещё нет сохранённых интервалов доступности. Добавьте первую запись
          на странице «Моя доступность».
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="records-panel">
        <div className="records-panel-header">
          <div>
            <h2>Интервалы доступности</h2>
            <p>
              Актуальные записи можно редактировать и удалять. Прошедшие записи
              доступны только для просмотра.
            </p>
          </div>

          <div className="records-tabs">
            <button
              type="button"
              className={filter === 'upcoming' ? 'active' : ''}
              onClick={() => setFilter('upcoming')}
            >
              Актуальные
              <span>{upcomingRecords.length}</span>
            </button>

            <button
              type="button"
              className={filter === 'past' ? 'active' : ''}
              onClick={() => setFilter('past')}
            >
              Архив
              <span>{pastRecords.length}</span>
            </button>
          </div>
        </div>

        {actionError && (
          <div className={`alert alert-error ${!showActionError ? 'alert-hide' : ''}`}>
            {actionError}
          </div>
        )}

        {visibleRecords.length === 0 ? (
          <div className="records-empty-inner">
            {filter === 'upcoming' ? (
              <>
                <h3>Актуальных записей нет</h3>
                <p>Добавьте доступность на странице календаря.</p>
              </>
            ) : (
              <>
                <h3>Архив пока пуст</h3>
                <p>Здесь появятся интервалы доступности за прошедшие даты.</p>
              </>
            )}
          </div>
        ) : (
          <div className="records-list">
            {visibleRecords.map((record) => {
              const isPastRecord = record.date < today
              const isEditing = editingId === record.id

              return (
                <article
                  key={record.id}
                  className={`record-card ${isPastRecord ? 'record-card-past' : ''}`}
                >
                  {isEditing ? (
                    <div className="record-edit-form">
                      <label>
                        Дата
                        <input
                          type="date"
                          name="date"
                          value={editForm.date}
                          onChange={handleEditChange}
                          min={today}
                        />
                      </label>

                      <label>
                        Начало
                        <input
                          type="time"
                          name="start_time"
                          value={editForm.start_time}
                          onChange={handleEditChange}
                        />
                      </label>

                      <label>
                        Конец
                        <input
                          type="time"
                          name="end_time"
                          value={editForm.end_time}
                          onChange={handleEditChange}
                        />
                      </label>

                      <div className="record-actions record-actions-edit">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleEditSave(record.id)}
                          disabled={isSavingEdit}
                        >
                          {isSavingEdit ? 'Сохранение...' : 'Сохранить'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleEditCancel}
                          disabled={isSavingEdit}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="record-card-main">
                        <div>
                          <span className="record-status">
                            {isPastRecord ? 'Прошедшая запись' : 'Актуально'}
                          </span>

                          <h3 className="record-date">{formatDate(record.date)}</h3>

                          <p className="record-time">
                            {formatTime(record.start_time)} — {formatTime(record.end_time)}
                          </p>
                        </div>

                        <div className="record-duration">
                          <span>Длительность</span>
                          <strong>
                            {getDurationText(record.start_time, record.end_time)}
                          </strong>
                        </div>
                      </div>

                      {isPastRecord ? (
                        <p className="record-past-note">
                          Прошедшие интервалы доступны только для просмотра.
                        </p>
                      ) : (
                        <div className="record-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => handleEditClick(record)}
                          >
                            Редактировать
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => openDeleteModal(record)}
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>

      {recordToDelete && (
        <ConfirmModal
          title="Подтверждение удаления"
          message={`Вы уверены, что хотите удалить запись на ${formatDate(recordToDelete.date)}?`}
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
          isLoading={isDeleting}
        />
      )}
    </>
  )
}

export default AvailabilityList