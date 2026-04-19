import { useEffect, useState } from 'react'
import {
  getAvailabilities,
  deleteAvailability,
  updateAvailability,
} from '../api/availability'

function AvailabilityList() {
  const [records, setRecords] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
  })

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

  const handleDelete = async (id) => {
    try {
      await deleteAvailability(id)
      setRecords(records.filter((record) => record.id !== id))
    } catch (err) {
      console.error('Ошибка при удалении записи:', err)
      alert('Не удалось удалить запись.')
    }
  }

  const handleEditClick = (record) => {
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
      alert('Не удалось обновить запись.')
    }
  }

  const handleEditCancel = () => {
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
    return <p style={{ color: 'red' }}>{error}</p>
  }

  if (records.length === 0) {
    return <p>Записей пока нет.</p>
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {records.map((record) => (
        <div
          key={record.id}
          style={{
            border: '1px solid #ccc',
            padding: '12px',
            marginBottom: '10px',
            borderRadius: '6px',
            maxWidth: '500px',
          }}
        >
          {editingId === record.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label>Дата</label>
              <input
                type="date"
                name="date"
                value={editForm.date}
                onChange={handleEditChange}
              />

              <label>Начало</label>
              <input
                type="time"
                name="start_time"
                value={editForm.start_time}
                onChange={handleEditChange}
              />

              <label>Конец</label>
              <input
                type="time"
                name="end_time"
                value={editForm.end_time}
                onChange={handleEditChange}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => handleEditSave(record.id)}>
                  Сохранить
                </button>
                <button onClick={handleEditCancel}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p><strong>Дата:</strong> {record.date}</p>
              <p><strong>Начало:</strong> {record.start_time}</p>
              <p><strong>Конец:</strong> {record.end_time}</p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleEditClick(record)}>
                  Редактировать
                </button>
                <button onClick={() => handleDelete(record.id)}>
                  Удалить
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default AvailabilityList