const shapeLabels = {
  round: 'Круглый',
  rect: 'Прямоугольный',
}

const zoneLabels = {
  main: 'Основной зал',
  terrace: 'Терраса',
  vip: 'VIP',
}

const tableMatchesSelectedFeatures = (table, selectedFeatureIds = []) => {
  if (!selectedFeatureIds.length) {
    return false
  }

  const tableFeatureIds = table.features_details?.map((feature) => String(feature.id)) || []

  return selectedFeatureIds.every((featureId) =>
    tableFeatureIds.includes(String(featureId))
  )
}

export default function AvailableTablesList({
  tables,
  selectedTableId,
  selectedFeatureIds = [],
  onSelectTable,
}) {
  if (!tables.length) {
    return null
  }

  return (
    <section className="available-tables-section">
      <div className="client-section-header">
        <div>
          <h2>Доступные столики</h2>
          <p>
            Все столики свободны на выбранное время. Рекомендованные варианты
            выделены по вашим пожеланиям.
          </p>
        </div>
      </div>

      <div className="available-tables-grid">
        {tables.map((table) => {
          const isSelected = selectedTableId === table.id
          const isRecommended = tableMatchesSelectedFeatures(table, selectedFeatureIds)

          return (
            <article
              key={table.id}
              className={`available-table-card ${
                isSelected ? 'selected' : ''
              } ${isRecommended ? 'recommended' : ''}`}
            >
              <div className="available-table-main">
                <div>
                  <span className="available-table-number">№{table.number}</span>
                  <h3>Столик на {table.capacity} гостей</h3>
                </div>

                {isRecommended ? (
                  <span className="available-table-badge recommended">
                    Рекомендуем
                  </span>
                ) : (
                  <span className="available-table-zone">
                    {zoneLabels[table.zone] || table.zone}
                  </span>
                )}
              </div>

              <div className="available-table-details">
                <p>
                  <strong>Форма:</strong> {shapeLabels[table.shape] || table.shape}
                </p>
                <p>
                  <strong>Вместимость:</strong> {table.capacity} мест
                </p>
                <p>
                  <strong>Зона:</strong> {zoneLabels[table.zone] || table.zone}
                </p>
              </div>

              {table.features_details?.length > 0 && (
                <div className="feature-tags">
                  {table.features_details.map((feature) => (
                    <span
                      key={feature.id}
                      className={`feature-tag ${
                        selectedFeatureIds.includes(String(feature.id)) ? 'matched' : ''
                      }`}
                    >
                      {feature.name}
                    </span>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => onSelectTable(table)}
              >
                {isSelected ? 'Выбран' : 'Выбрать столик'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}