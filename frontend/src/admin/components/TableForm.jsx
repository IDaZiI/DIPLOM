import { useState } from 'react'

const MAX_TABLE_CAPACITY = 20

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
    shape: 'rect',
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

      const capacity = Number(formData.capacity)

      if (capacity < 1 || capacity > MAX_TABLE_CAPACITY) {
        e.target.reportValidity()
        return
      }

      onSubmit({
        ...formData,
        number: Number(formData.number),
        capacity,
        x: Number(formData.x),
        y: Number(formData.y),
        width: Number(formData.width),
        height: Number(formData.height),
        features: formData.features,
      })
    }

  return (
    <form onSubmit={handleSubmit} className="table-form">

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

        <small className="table-form-hint">
          Номера столиков не должны повторяться.
        </small>
      </div>

      <div className="table-form-row">
        <label htmlFor="capacity">Вместимость</label>

        <input
          id="capacity"
          type="number"
          name="capacity"
          min="1"
          max={MAX_TABLE_CAPACITY}
          value={formData.capacity}
          onChange={handleChange}
          required
        />

        <small className="table-form-hint">
          От 1 до {MAX_TABLE_CAPACITY} мест за одним столиком.
        </small>
      </div>

      <div className="table-form-row">
        <label htmlFor="shape">Форма</label>
        <select
          id="shape"
          name="shape"
          value={formData.shape}
          onChange={handleChange}
        >
          <option value="rect">Прямоугольный</option>
          <option value="round">Круглый</option>
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

      <div className="table-form-row full table-form-features">
        <span className="table-form-section-label">Характеристики столика</span>

        <div className="table-form-chip-list">
          {features.length ? (
            features.map((feature) => {
              const isSelected = formData.features.includes(feature.id)

              return (
                <label
                  key={feature.id}
                  className={`table-form-chip ${isSelected ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleFeatureChange(feature.id)}
                    className="table-form-chip-input"
                  />
                  <span className="table-form-chip-text">{feature.name}</span>
                </label>
              )
            })
          ) : (
            <p className="feature-empty">Характеристики пока не добавлены.</p>
          )}
        </div>
      </div>

      <label
        htmlFor="is_active"
        className={`table-form-toggle ${formData.is_active ? 'checked' : ''}`}
      >
        <input
          id="is_active"
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
          className="table-form-toggle-input"
        />

        <span className="table-form-toggle-switch" />
        <span className="table-form-toggle-text">Активен</span>
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