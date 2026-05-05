const MAP_WIDTH = 1000
const MAP_HEIGHT = 707

const shapeClassMap = {
  round: 'client-map-table round',
  rect: 'client-map-table rect',
}

const toPercent = (value, max) => `${(value / max) * 100}%`

const tableMatchesSelectedFeatures = (table, selectedFeatureIds = []) => {
  if (!selectedFeatureIds.length) {
    return false
  }

  const tableFeatureIds = table.features_details?.map((feature) => String(feature.id)) || []

  return selectedFeatureIds.every((featureId) =>
    tableFeatureIds.includes(String(featureId))
  )
}

export default function ClientHallMap({
  tables,
  hallScheme,
  selectedTableId,
  selectedFeatureIds = [],
  onSelectTable,
}) {
  if (!hallScheme?.image_url) {
    return (
      <div className="client-hall-map-empty">
        <h3>Схема зала пока не загружена</h3>
        <p>Вы можете выбрать столик из списка ниже.</p>
      </div>
    )
  }

  return (
    <div className="client-hall-map-card">
      <div className="client-section-header">
        <div>
          <h2>Схема зала</h2>
          <p>
            Нажмите на свободный столик на схеме, чтобы выбрать его для бронирования.
          </p>
        </div>
      </div>

      <div
        className="client-hall-map"
        style={{ backgroundImage: `url(${hallScheme.image_url})` }}
      >
        {tables.map((table) => {
          const isSelected = selectedTableId === table.id
          const isRecommended = tableMatchesSelectedFeatures(table, selectedFeatureIds)

          return (
            <button
              key={table.id}
              type="button"
              className={`${shapeClassMap[table.shape] || 'client-map-table rect'} ${
                isSelected ? 'selected' : ''
              } ${isRecommended ? 'recommended' : ''}`}
              style={{
                left: toPercent(table.x, MAP_WIDTH),
                top: toPercent(table.y, MAP_HEIGHT),
                width: toPercent(table.width, MAP_WIDTH),
                height: toPercent(table.height, MAP_HEIGHT),
              }}
              onClick={() => onSelectTable(table)}
              title={`Столик №${table.number}, ${table.capacity} мест`}
            >
              <span>{table.number}</span>
            </button>
          )
        })}
      </div>

      <div className="client-map-legend">
        <span><i className="legend-dot default" /> Доступен</span>
        <span><i className="legend-dot recommended" /> Подходит под пожелания</span>
        <span><i className="legend-dot selected" /> Выбран</span>
      </div>
    </div>
  )
}