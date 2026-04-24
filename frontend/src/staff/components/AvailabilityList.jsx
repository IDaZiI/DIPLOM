import { useEffect, useState } from 'react'
import {
  getAvailabilities,
  deleteAvailability,
  updateAvailability,
} from '../../api/availability'
import ConfirmModal from './ConfirmModal'
import { formatDate } from '../../utils/formatDate'
import { formatTime } from '../../utils/formatTime'
import { getErrorMessage } from '../../utils/getErrorMessage'

function AvailabilityList() {
  const [records, setRecords] = useState([])
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
  const today = new Date().toISOString().split('T')[0]
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
        setRecords(response.data)
      } catch (err) {
        console.error('Ошибка при загрузке записей:', err)
        setError('Не удалось загрузить записи.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const openDeleteModal = (record) => {
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
      setRecords(records.filter((record) => record.id !== recordToDelete.id))
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
    setActionError('')
    setShowActionError(false)
    setEditingId(record.id)
    setEditForm({
      date: record.date,
      start_time: formatTime(record.start_time),
      end_time: formatTime(record.end_time),
    })
  }

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    })
  }

  const handleEditSave = async (id) => {
    setActionError('')
    setShowActionError(false)
    setIsSavingEdit(true)

    try {
      const response = await updateAvailability(id, editForm)

      setRecords(
        records.map((record) =>
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
    return <p>Загрузка...</p>
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  if (records.length === 0) {
    return (
      <div className="card empty-state">
        <h2 className="empty-state-title">Пока нет записей</h2>
        <p className="empty-state-text">
          У вас ещё нет сохранённых интервалов доступности. Добавьте первую запись
          на странице «Моя доступность».
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="records-list">
        {records.map((record) => (
          <div key={record.id} className="card">
            {editingId === record.id ? (
              <div className="form">
                <div>
                  <label htmlFor={`date-${record.id}`}>Дата</label>
                  <input
                    id={`date-${record.id}`}
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditChange}
                    min={today}
                  />
                </div>

                <div>
                  <label htmlFor={`start_time-${record.id}`}>Начало</label>
                  <input
                    id={`start_time-${record.id}`}
                    type="time"
                    name="start_time"
                    value={editForm.start_time}
                    onChange={handleEditChange}
                  />
                </div>

                <div>
                  <label htmlFor={`end_time-${record.id}`}>Конец</label>
                  <input
                    id={`end_time-${record.id}`}
                    type="time"
                    name="end_time"
                    value={editForm.end_time}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="record-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEditSave(record.id)}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? 'Сохранение...' : 'Сохранить'}
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handleEditCancel}
                    disabled={isSavingEdit}
                  >
                    Отмена
                  </button>
                </div>

                {actionError && (
                  <div className={`alert alert-error ${!showActionError ? 'alert-hide' : ''}`}>
                    {actionError}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="record-meta">
                  <h3 className="record-date">{formatDate(record.date)}</h3>
                  <p className="record-time">
                    Время: {formatTime(record.start_time)} — {formatTime(record.end_time)}
                  </p>
                </div>

                <div className="record-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleEditClick(record)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => openDeleteModal(record)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
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