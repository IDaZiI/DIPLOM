import { useRef, useState } from 'react'

const shapeClassMap = {
  round: 'hall-table round',
  square: 'hall-table square',
  rect: 'hall-table rect',
}

const isOverlapping = (movingTable, nextPosition, tables) => {
  const movingLeft = nextPosition.x
  const movingRight = nextPosition.x + movingTable.width
  const movingTop = nextPosition.y
  const movingBottom = nextPosition.y + movingTable.height

  return tables.some((table) => {
    if (table.id === movingTable.id) return false

    const tableLeft = table.x
    const tableRight = table.x + table.width
    const tableTop = table.y
    const tableBottom = table.y + table.height

    const noOverlap =
      movingRight <= tableLeft ||
      movingLeft >= tableRight ||
      movingBottom <= tableTop ||
      movingTop >= tableBottom

    return !noOverlap
  })
}

export default function HallMap({
  tables,
  onEdit,
  onMapClick,
  onMoveTable,
}) {
  const mapRef = useRef(null)
  const [draggingId, setDraggingId] = useState(null)

  const handleMapClick = (e) => {
    if (draggingId) return
    if (e.target !== e.currentTarget) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)

    onMapClick({ x, y })
  }

  const handleMouseDown = (e, table) => {
    e.preventDefault()
    e.stopPropagation()

    const mapRect = mapRef.current.getBoundingClientRect()
    const startOffsetX = e.clientX - mapRect.left - table.x
    const startOffsetY = e.clientY - mapRect.top - table.y

    setDraggingId(table.id)

    const handleMouseMove = (moveEvent) => {
      const currentMapRect = mapRef.current.getBoundingClientRect()

      let newX = Math.round(moveEvent.clientX - currentMapRect.left - startOffsetX)
      let newY = Math.round(moveEvent.clientY - currentMapRect.top - startOffsetY)

      const maxX = currentMapRect.width - table.width
      const maxY = currentMapRect.height - table.height

      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

			const overlaps = isOverlapping(table, { x: newX, y: newY }, tables)
			if (overlaps) return

      onMoveTable(table, { x: newX, y: newY }, false)
    }

    const handleMouseUp = async (upEvent) => {
      const currentMapRect = mapRef.current.getBoundingClientRect()

      let newX = Math.round(upEvent.clientX - currentMapRect.left - startOffsetX)
      let newY = Math.round(upEvent.clientY - currentMapRect.top - startOffsetY)

      const maxX = currentMapRect.width - table.width
      const maxY = currentMapRect.height - table.height

      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

			const overlaps = isOverlapping(table, { x: newX, y: newY }, tables)
			if (overlaps) {
				setDraggingId(null)
				window.removeEventListener('mousemove', handleMouseMove)
				window.removeEventListener('mouseup', handleMouseUp)
				return
			}

      setDraggingId(null)
      onMoveTable(table, { x: newX, y: newY }, true)

      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="hall-map-wrapper">
      <h2>Карта зала</h2>

      <div
        ref={mapRef}
        className="hall-map"
        onClick={handleMapClick}
      >
        {tables.map((table) => (
          <button
            key={table.id}
            type="button"
            className={`${shapeClassMap[table.shape] || 'hall-table'} ${
              table.is_active ? '' : 'inactive'
            } ${draggingId === table.id ? 'dragging' : ''}`}
            style={{
              left: `${table.x}px`,
              top: `${table.y}px`,
              width: `${table.width}px`,
              height: `${table.height}px`,
            }}
            onClick={(e) => {
              e.stopPropagation()
              onEdit(table)
            }}
            onMouseDown={(e) => handleMouseDown(e, table)}
            title={`Столик №${table.number}`}
          >
            <span className="hall-table-number">{table.number}</span>
            <span className="hall-table-capacity">{table.capacity} места</span>
          </button>
        ))}
      </div>
    </div>
  )
}