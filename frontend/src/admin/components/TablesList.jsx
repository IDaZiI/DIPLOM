const shapeLabels = {
  round: 'Круглый',
  rect: 'Прямоугольный',
}

const zoneLabels = {
  main: 'Основной зал',
  terrace: 'Терраса',
  vip: 'VIP',
}

export default function TablesList({ tables, onEdit, onDelete }) {
  if (!tables.length) {
    return <p className="table-list-empty">Столики пока не добавлены.</p>
  }

  return (
    <div className="table-list">
      {tables.map((table) => (
        <article key={table.id} className="table-list-card">
          <div className="table-card-header">
            <div>
              <h3 className="table-card-title">Столик №{table.number}</h3>
              <p className="table-card-subtitle">
                {zoneLabels[table.zone] || table.zone}
              </p>
            </div>

            <span className={`table-card-status ${table.is_active ? 'active' : 'inactive'}`}>
              {table.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </div>

          <div className="table-card-grid">
            <div className="table-card-item">
              <span>Вместимость</span>
              <strong>{table.capacity} мест</strong>
            </div>

            <div className="table-card-item">
              <span>Форма</span>
              <strong>{shapeLabels[table.shape] || table.shape}</strong>
            </div>

            <div className="table-card-item">
              <span>Координаты</span>
              <strong>({table.x}, {table.y})</strong>
            </div>

            <div className="table-card-item">
              <span>Размер</span>
              <strong>{table.width} × {table.height}</strong>
            </div>
          </div>

          <div className="table-features-preview">
            <p className="table-features-title">Характеристики</p>

            {table.features_details?.length ? (
              <div className="feature-tags">
                {table.features_details.map((feature) => (
                  <span key={feature.id} className="feature-tag">
                    {feature.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="feature-empty-inline">Характеристики не указаны</p>
            )}
          </div>

          <div className="table-list-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onEdit(table)}
            >
              Редактировать
            </button>

            <button
              type="button"
              className="btn btn-danger"
              onClick={() => onDelete(table.id)}
            >
              Удалить
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}