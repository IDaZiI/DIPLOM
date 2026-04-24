export default function AvailableTablesList({ tables, onSelectTable }) {
  if (!tables.length) {
    return <p>Свободные столики не найдены.</p>
  }

  return (
    <div className="tables-list">
      <h2>Доступные столики</h2>

      <div>
        {tables.map((table) => (
          <div key={table.id} className="table-card">
            <p><strong>Столик №:</strong> {table.number}</p>
            <p><strong>Вместимость:</strong> {table.capacity}</p>
            <p><strong>Форма:</strong> {table.shape}</p>
            <p><strong>Зона:</strong> {table.zone}</p>

            {table.features_details?.length > 0 && (
              <div className="table-features-preview">
                <strong>Особенности:</strong>
                <div className="feature-tags">
                  {table.features_details.map((feature) => (
                    <span key={feature.id} className="feature-tag">
                      {feature.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => onSelectTable(table)}>
              Выбрать
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}