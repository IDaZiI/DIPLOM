import { useEffect, useState } from 'react'
import {
  getAvailabilities,
  deleteAvailability,
  updateAvailability,
} from '../api/availability'
import ConfirmModal from './ConfirmModal'

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

  const getErrorMessage = (data) => {
    if (!data) {
      return 'Не удалось выполнить действие.'
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

    return 'Не удалось выполнить действие.'
  }

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

    try {
      await deleteAvailability(recordToDelete.id)
      setRecords(records.filter((record) => record.id !== recordToDelete.id))
      setRecordToDelete(null)
    } catch (err) {
      console.error('Ошибка при удалении записи:', err)
      setShowActionError(true)
      setActionError(getErrorMessage(err.response?.data))
      setRecordToDelete(null)
    }
  }

  const handleEditClick = (record) => {
    setActionError('')
    setShowActionError(false)
    setEditingId(record.id)
    setEditForm({
      date: record.date,
      start_time: record.start_time.slice(0, 5),
      end_time: record.end_time.slice(0, 5),
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
                  >
                    Сохранить
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleEditCancel}
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
                  <h3 className="record-date">{record.date}</h3>
                  <p className="record-time">
                    Время: {record.start_time.slice(0, 5)} — {record.end_time.slice(0, 5)}
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
          message={`Вы уверены, что хотите удалить запись на ${recordToDelete.date}?`}
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />
      )}
    </>
  )
}

export default AvailabilityList