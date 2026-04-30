import './AdminTablesPage.css'
import { useEffect, useState } from 'react'
import TablesList from '../components/TablesList'
import HallMap from '../components/HallMap'
import TableFormModal from '../components/TableFormModal'
import HallSchemePanel from '../components/HallSchemePanel'

import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  getTableFeatures,
  getHallScheme,
  updateHallScheme,
  deleteHallScheme,
} from '../../api/reservations'

const getBackendErrorMessage = (err, fallbackMessage) => {
  const backendError = err.response?.data

  if (Array.isArray(backendError)) {
    return backendError.join(' ')
  }

  if (typeof backendError === 'string') {
    return backendError
  }

  if (backendError?.detail) {
    return backendError.detail
  }

  if (backendError?.non_field_errors) {
    return backendError.non_field_errors.join(' ')
  }

  if (backendError && typeof backendError === 'object') {
    const messages = Object.values(backendError)
      .flat()
      .filter(Boolean)

    if (messages.length) {
      return messages.join(' ')
    }
  }

  return fallbackMessage
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [presetPosition, setPresetPosition] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [features, setFeatures] = useState([])
  const [hallScheme, setHallScheme] = useState(null)
  const [schemeUploading, setSchemeUploading] = useState(false)
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)

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
        const [tablesData, featuresData, hallSchemeData] = await Promise.all([
          getTables(),
          getTableFeatures(),
          getHallScheme(),
        ])

        setTables(tablesData)
        setFeatures(featuresData)
        setHallScheme(hallSchemeData)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить данные страницы.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  const handleHallSchemeUpload = async (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('image', file)

    setSchemeUploading(true)
    setError('')
    setSuccessMessage('')

    try {
      const data = await updateHallScheme(formData)
      setHallScheme(data)
      setSuccessMessage('Схема зала обновлена.')
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить изображение схемы зала.')
    } finally {
      setSchemeUploading(false)
      event.target.value = ''
    }
  }

  const handleDeleteHallScheme = async () => {
    const confirmed = window.confirm('Удалить изображение схемы зала?')

    if (!confirmed) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      await deleteHallScheme()

      setHallScheme((prev) => ({
        ...prev,
        image: null,
        image_url: null,
      }))

      setSuccessMessage('Схема зала удалена.')
    } catch (err) {
      console.error(err)
      setError('Не удалось удалить схему зала.')
    }
  }

  const handleOpenCreateModal = (position) => {
    setSelectedTable(null)
    setPresetPosition(position)
    setIsTableModalOpen(true)
    setError('')
    setSuccessMessage('')
  }

  const handleOpenEditModal = (table) => {
    setSelectedTable(table)
    setPresetPosition({
      x: table.x,
      y: table.y,
    })
    setIsTableModalOpen(true)
    setError('')
    setSuccessMessage('')
  }

  const handleCloseTableModal = () => {
    setSelectedTable(null)
    setPresetPosition({ x: 0, y: 0 })
    setIsTableModalOpen(false)
    setError('')
  }

  const handleSubmit = async (formData) => {
    setFormLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      if (selectedTable) {
        await updateTable(selectedTable.id, formData)
        setSuccessMessage('Столик успешно обновлён.')
      } else {
        await createTable(formData)
        setSuccessMessage('Столик успешно добавлен.')
      }

      setSelectedTable(null)
      setPresetPosition({ x: 0, y: 0 })
      setIsTableModalOpen(false)

      await loadTables({ showLoader: false })
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось сохранить столик.'))
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Удалить этот столик?')

    if (!confirmed) {
      return
    }

    setError('')
    setSuccessMessage('')

    try {
      await deleteTable(id)
      setSuccessMessage('Столик успешно удалён.')

      if (selectedTable?.id === id) {
        setSelectedTable(null)
      }

      await loadTables({ showLoader: false })
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось удалить столик.'))
    }
  }

  const handleMapClick = ({ x, y }) => {
    handleOpenCreateModal({ x, y })
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

    if (!shouldSave) {
      return
    }

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
        features: table.features,
      })

      setSuccessMessage(`Позиция столика №${table.number} сохранена.`)
      setError('')
    } catch (err) {
      console.error(err)
      setError(getBackendErrorMessage(err, 'Не удалось сохранить новую позицию столика.'))
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

      {loading ? (
        <div className="admin-card">
          <p>Загрузка карты и списка столиков...</p>
        </div>
      ) : (
        <div className="admin-map-section">
          <HallSchemePanel
            hallScheme={hallScheme}
            schemeUploading={schemeUploading}
            onUpload={handleHallSchemeUpload}
            onDelete={handleDeleteHallScheme}
          />

          <HallMap
            tables={tables}
            hallScheme={hallScheme}
            onEdit={handleOpenEditModal}
            onMapClick={handleMapClick}
            onMoveTable={handleMoveTable}
          />
        </div>
      )}

      {!loading && (
        <div className="tables-list-section">
          <h2>Список столиков</h2>

          <TablesList
            tables={tables}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />
        </div>
      )}

      <TableFormModal
        isOpen={isTableModalOpen}
        selectedTable={selectedTable}
        presetPosition={presetPosition}
        features={features}
        onSubmit={handleSubmit}
        onClose={handleCloseTableModal}
        loading={formLoading}
      />
    </div>
  )
}