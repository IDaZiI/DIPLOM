import { useRef, useState } from 'react'

const MAP_WIDTH = 1000
const MAP_HEIGHT = 707
const DRAG_THRESHOLD = 4

const shapeClassMap = {
  round: 'hall-table round',
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

const toPercent = (value, max) => `${(value / max) * 100}%`

const getMapPosition = (event, mapElement) => {
  const rect = mapElement.getBoundingClientRect()

  const x = Math.round(((event.clientX - rect.left) / rect.width) * MAP_WIDTH)
  const y = Math.round(((event.clientY - rect.top) / rect.height) * MAP_HEIGHT)

  return {
    x: Math.max(0, Math.min(x, MAP_WIDTH)),
    y: Math.max(0, Math.min(y, MAP_HEIGHT)),
  }
}

export default function HallMap({
  tables,
  hallScheme,
  onEdit,
  onMapClick,
  onMoveTable,
}) {
  const mapRef = useRef(null)
  const dragStartRef = useRef(null)
  const suppressClickRef = useRef(false)
  const [draggingId, setDraggingId] = useState(null)

  const handleMapClick = (event) => {
    if (draggingId) return
    if (event.target !== event.currentTarget) return

    const position = getMapPosition(event, event.currentTarget)

    onMapClick(position)
  }

  const handleTableClick = (event, table) => {
    event.stopPropagation()

    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }

    onEdit(table)
  }

  const handleMouseDown = (event, table) => {
    event.preventDefault()
    event.stopPropagation()

    const mapElement = mapRef.current
    const startPosition = getMapPosition(event, mapElement)

    dragStartRef.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      offsetX: startPosition.x - table.x,
      offsetY: startPosition.y - table.y,
      hasMoved: false,
    }

    setDraggingId(table.id)

    const handleMouseMove = (moveEvent) => {
      const dragStart = dragStartRef.current

      if (!dragStart) return

      const diffX = Math.abs(moveEvent.clientX - dragStart.mouseX)
      const diffY = Math.abs(moveEvent.clientY - dragStart.mouseY)

      if (diffX > DRAG_THRESHOLD || diffY > DRAG_THRESHOLD) {
        dragStart.hasMoved = true
      }

      const currentPosition = getMapPosition(moveEvent, mapElement)

      let newX = Math.round(currentPosition.x - dragStart.offsetX)
      let newY = Math.round(currentPosition.y - dragStart.offsetY)

      const maxX = MAP_WIDTH - table.width
      const maxY = MAP_HEIGHT - table.height

      newX = Math.max(0, Math.min(newX, maxX))
      newY = Math.max(0, Math.min(newY, maxY))

      const overlaps = isOverlapping(table, { x: newX, y: newY }, tables)

      if (overlaps) return

      onMoveTable(table, { x: newX, y: newY }, false)
    }

    const handleMouseUp = (upEvent) => {
      const dragStart = dragStartRef.current

      if (!dragStart) {
        setDraggingId(null)
        return
      }

      const diffX = Math.abs(upEvent.clientX - dragStart.mouseX)
      const diffY = Math.abs(upEvent.clientY - dragStart.mouseY)
      const wasDragged =
        dragStart.hasMoved || diffX > DRAG_THRESHOLD || diffY > DRAG_THRESHOLD

      if (wasDragged) {
        const currentPosition = getMapPosition(upEvent, mapElement)

        let newX = Math.round(currentPosition.x - dragStart.offsetX)
        let newY = Math.round(currentPosition.y - dragStart.offsetY)

        const maxX = MAP_WIDTH - table.width
        const maxY = MAP_HEIGHT - table.height

        newX = Math.max(0, Math.min(newX, maxX))
        newY = Math.max(0, Math.min(newY, maxY))

        const overlaps = isOverlapping(table, { x: newX, y: newY }, tables)

        if (!overlaps) {
          onMoveTable(table, { x: newX, y: newY }, true)
        }

        suppressClickRef.current = true
      }

      dragStartRef.current = null
      setDraggingId(null)

      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="hall-map-wrapper">
      <h2>Карта зала</h2>

      <p className="hall-map-hint">
        Нажмите на свободное место схемы, чтобы создать столик, или перетащите существующий столик для изменения его положения.
      </p>

      <div
        ref={mapRef}
        className={`hall-map ${hallScheme?.image_url ? 'has-background' : ''}`}
        style={
          hallScheme?.image_url
            ? { backgroundImage: `url(${hallScheme.image_url})` }
            : undefined
        }
        onClick={handleMapClick}
      >
        {tables.map((table) => (
          <button
            key={table.id}
            type="button"
            className={`${shapeClassMap[table.shape] || 'hall-table rect'} ${
              table.is_active ? '' : 'inactive'
            } ${draggingId === table.id ? 'dragging' : ''}`}
            style={{
              left: toPercent(table.x, MAP_WIDTH),
              top: toPercent(table.y, MAP_HEIGHT),
              width: toPercent(table.width, MAP_WIDTH),
              height: toPercent(table.height, MAP_HEIGHT),
            }}
            onClick={(event) => handleTableClick(event, table)}
            onMouseDown={(event) => handleMouseDown(event, table)}
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