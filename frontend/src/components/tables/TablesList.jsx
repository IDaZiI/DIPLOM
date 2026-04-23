const shapeLabels = {
  round: 'Круглый',
  square: 'Квадратный',
  rect: 'Прямоугольный',
}

const zoneLabels = {
  main: 'Основной зал',
  terrace: 'Терраса',
  vip: 'VIP',
}

export default function TablesList({ tables, onEdit, onDelete }) {
  if (!tables.length) {
    return <p>Столики пока не добавлены.</p>
  }

  return (
    <div className="table-list">
      {tables.map((table) => (
        <div key={table.id} className="table-list-card">
          <p><strong>Номер:</strong> {table.number}</p>
          <p><strong>Вместимость:</strong> {table.capacity}</p>
          <p><strong>Форма:</strong> {shapeLabels[table.shape] || table.shape}</p>
          <p><strong>Зона:</strong> {zoneLabels[table.zone] || table.zone}</p>
          <p><strong>Координаты:</strong> ({table.x}, {table.y})</p>
          <p><strong>Размер:</strong> {table.width} × {table.height}</p>
          <p><strong>Статус:</strong> {table.is_active ? 'Активен' : 'Неактивен'}</p>

          <div className="table-list-actions">
            <button
              type="button"
              className="table-list-btn edit"
              onClick={() => onEdit(table)}
            >
              Редактировать
            </button>

            <button
              type="button"
              className="table-list-btn delete"
              onClick={() => onDelete(table.id)}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}