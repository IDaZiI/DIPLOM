import './AdminTablesPage.css'
import { useEffect, useState } from 'react'
import TableForm from '../components/TableForm'
import TablesList from '../components/TablesList'
import HallMap from '../components/HallMap'

import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getTableFeatures,
} from '../../api/reservations'

export default function AdminTablesPage() {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [presetPosition, setPresetPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [features, setFeatures] = useState([])

  const loadTables = async ({ showLoader = true } = {}) => {
    if (showLoader) {
      setLoading(true)
    }

    try {
      const data = await getTables()
      setTables(data)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить список столиков.')
    } finally {
      if (showLoader) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tablesData, featuresData] = await Promise.all([
          getTables(),
          getTableFeatures(),
        ])

        setTables(tablesData)
        setFeatures(featuresData)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить данные страницы.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleSubmit = async (formData) => {
    setFormLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (selectedTable) {
        await updateTable(selectedTable.id, formData)
        setSuccessMessage('Столик успешно обновлен.')
      } else {
        await createTable(formData)
        setSuccessMessage('Столик успешно добавлен.')
      }

      setSelectedTable(null)
      await loadTables()
    } catch (err) {
      console.error(err)

      const serverError =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Не удалось сохранить столик.'

      setError(serverError)
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (table) => {
    setSelectedTable(table)
    setError('')
    setSuccessMessage('')
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Удалить этот столик?')
    if (!confirmed) return

    setError('')
    setSuccessMessage('')

    try {
      await deleteTable(id)
      setSuccessMessage('Столик успешно удален.')

      if (selectedTable?.id === id) {
        setSelectedTable(null)
      }

      await loadTables()
    } catch (err) {
      console.error(err)
      setError('Не удалось удалить столик.')
    }
  }

  const handleCancelEdit = () => {
    setSelectedTable(null)
    setError('')
    setSuccessMessage('')
  }

  const handleMapClick = ({ x, y }) => {
    if (selectedTable) return

    setPresetPosition({ x, y })
    setSuccessMessage(`Выбрана позиция на карте: x=${x}, y=${y}`)
    setError('')
  }

  const handleMoveTable = async (table, position, shouldSave) => {
  setTables((currentTables) =>
      currentTables.map((item) =>
      item.id === table.id
          ? { ...item, x: position.x, y: position.y }
          : item
      )
  )

  if (selectedTable?.id === table.id) {
      setSelectedTable((currentSelected) =>
      currentSelected
          ? { ...currentSelected, x: position.x, y: position.y }
          : currentSelected
      )
  }

  if (!shouldSave) return

  try {
      await updateTable(table.id, {
      number: table.number,
      capacity: table.capacity,
      shape: table.shape,
      x: position.x,
      y: position.y,
      width: table.width,
      height: table.height,
      zone: table.zone,
      is_active: table.is_active,
      })

      setSuccessMessage(`Позиция столика №${table.number} сохранена`)
      setError('')
  } catch (err) {
      console.error(err)

      const serverError =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Не удалось сохранить новую позицию столика.'

      setError(serverError)
      await loadTables({ showLoader: false })
    }
  }

return (
  <div className="admin-tables-page">
    <div className="admin-page-header">
      <h1>Управление столиками</h1>
    </div>

    {error && <p className="admin-message error">{error}</p>}
    {successMessage && <p className="admin-message success">{successMessage}</p>}

    <div className="admin-top-grid">
      <div className="admin-card">
        <TableForm
          key={
            selectedTable
              ? `edit-${selectedTable.id}`
              : `new-${presetPosition.x}-${presetPosition.y}`
          }
          selectedTable={selectedTable}
          presetPosition={presetPosition}
          features={features}
          onSubmit={handleSubmit}
          onCancelEdit={handleCancelEdit}
          loading={formLoading}
        />
      </div>

      {loading ? (
        <div className="admin-card">
          <p>Загрузка карты и списка столиков...</p>
        </div>
      ) : (
        <HallMap
          tables={tables}
          onEdit={handleEdit}
          onMapClick={handleMapClick}
          onMoveTable={handleMoveTable}
        />
      )}
    </div>

    {!loading && (
      <div>
        <h2>Список столиков</h2>
        <TablesList
          tables={tables}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    )}
  </div>
)
}