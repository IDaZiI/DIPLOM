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

    try {
      await deleteAvailability(recordToDelete.id)
      setRecords(records.filter((record) => record.id !== recordToDelete.id))
      setRecordToDelete(null)
    } catch (err) {
      console.error('Ошибка при удалении записи:', err)
      setActionError(getErrorMessage(err.response?.data))
      setRecordToDelete(null)
    }
  }

  const handleEditClick = (record) => {
    setActionError('')
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
      setActionError(getErrorMessage(err.response?.data))
    }
  }

  const handleEditCancel = () => {
    setActionError('')
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
    return <p className="message-error">{error}</p>
  }

  if (records.length === 0) {
    return <div className="card">Записей пока нет.</div>
  }

  return (
    <>
      <div className="records-list">
        {actionError && <p className="message-error">{actionError}</p>}

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
              </div>
            ) : (
              <div>
                <p><strong>Дата:</strong> {record.date}</p>
                <p><strong>Начало:</strong> {record.start_time.slice(0, 5)}</p>
                <p><strong>Конец:</strong> {record.end_time.slice(0, 5)}</p>

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