import { useState } from 'react'

const getInitialFormState = (selectedTable, presetPosition) => {
  if (selectedTable) {
    return {
      number: selectedTable.number,
      capacity: selectedTable.capacity,
      shape: selectedTable.shape,
      x: selectedTable.x,
      y: selectedTable.y,
      width: selectedTable.width,
      height: selectedTable.height,
      zone: selectedTable.zone,
      is_active: selectedTable.is_active,
      features: selectedTable.features || [],
    }
  }

  return {
    number: '',
    capacity: '',
    shape: 'square',
    x: presetPosition?.x ?? 0,
    y: presetPosition?.y ?? 0,
    width: 80,
    height: 80,
    zone: 'main',
    is_active: true,
    features: [],
  }
}

export default function TableForm({
  selectedTable,
  presetPosition,
  features = [],
  onSubmit,
  onCancelEdit,
  loading,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormState(selectedTable, presetPosition)
  )

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleFeatureChange = (featureId) => {
    setFormData((current) => {
      const alreadySelected = current.features.includes(featureId)

      return {
        ...current,
        features: alreadySelected
          ? current.features.filter((id) => id !== featureId)
          : [...current.features, featureId],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    onSubmit({
      ...formData,
      number: Number(formData.number),
      capacity: Number(formData.capacity),
      x: Number(formData.x),
      y: Number(formData.y),
      width: Number(formData.width),
      height: Number(formData.height),
      features: formData.features,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="table-form">
      <h2>{selectedTable ? 'Редактирование столика' : 'Добавление столика'}</h2>

      <div className="table-form-row">
        <label htmlFor="number">Номер</label>
        <input
          id="number"
          type="number"
          name="number"
          value={formData.number}
          onChange={handleChange}
          required
        />
      </div>

      <div className="table-form-row">
        <label htmlFor="capacity">Вместимость</label>
        <input
          id="capacity"
          type="number"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
        />
      </div>

      <div className="table-form-row">
        <label htmlFor="shape">Форма</label>
        <select
          id="shape"
          name="shape"
          value={formData.shape}
          onChange={handleChange}
        >
          <option value="round">Круглый</option>
          <option value="square">Квадратный</option>
          <option value="rect">Прямоугольный</option>
        </select>
      </div>

      <div className="table-form-row">
        <label htmlFor="zone">Зона</label>
        <select
          id="zone"
          name="zone"
          value={formData.zone}
          onChange={handleChange}
        >
          <option value="main">Основной зал</option>
          <option value="terrace">Терраса</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      <div className="table-form-row">
        <label htmlFor="x">X</label>
        <input
          id="x"
          type="number"
          name="x"
          value={formData.x}
          onChange={handleChange}
          required
        />
      </div>

      <div className="table-form-row">
        <label htmlFor="y">Y</label>
        <input
          id="y"
          type="number"
          name="y"
          value={formData.y}
          onChange={handleChange}
          required
        />
      </div>

      <div className="table-form-row">
        <label htmlFor="width">Ширина</label>
        <input
          id="width"
          type="number"
          name="width"
          value={formData.width}
          onChange={handleChange}
          required
        />
      </div>

      <div className="table-form-row">
        <label htmlFor="height">Высота</label>
        <input
          id="height"
          type="number"
          name="height"
          value={formData.height}
          onChange={handleChange}
          required
        />
      </div>

      <div className="table-form-row full">
        <label>Характеристики столика</label>
        <div className="feature-list">
          {features.length ? (
            features.map((feature) => (
              <label key={feature.id} className="feature-item">
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature.id)}
                  onChange={() => handleFeatureChange(feature.id)}
                />
                {feature.name}
              </label>
            ))
          ) : (
            <p className="feature-empty">Характеристики пока не добавлены.</p>
          )}
        </div>
      </div>

      <label htmlFor="is_active" className="table-form-checkbox">
        <input
          id="is_active"
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
        />
        Активен
      </label>

      <div className="table-form-actions">
        <button type="submit" className="admin-btn primary" disabled={loading}>
          {loading
            ? 'Сохранение...'
            : selectedTable
              ? 'Сохранить изменения'
              : 'Добавить столик'}
        </button>

        {selectedTable && (
          <button
            type="button"
            className="admin-btn secondary"
            onClick={onCancelEdit}
          >
            Отменить редактирование
          </button>
        )}
      </div>
    </form>
  )
}