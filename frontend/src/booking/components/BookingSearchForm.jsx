import { useState } from 'react'

export default function BookingSearchForm({ onSearch, loading, features = [] }) {
  const [formData, setFormData] = useState({
    date: '',
    start_time: '',
    guest_count: 1,
    features: [],
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFeatureToggle = (featureId) => {
    setFormData((prev) => {
      const id = String(featureId)

      const nextFeatures = prev.features.includes(id)
        ? prev.features.filter((item) => item !== id)
        : [...prev.features, id]

      return {
        ...prev,
        features: nextFeatures,
      }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const preparedData = {
      date: formData.date,
      start_time: formData.start_time,
      guest_count: Number(formData.guest_count),
      features: formData.features,
    }

    onSearch(preparedData)
  }

  return (
    <section className="booking-search-card">
      <div className="booking-search-intro">
        <span className="booking-step-badge">Шаг 1</span>
        <div>
          <h2>Найдите свободный столик</h2>
          <p>
            Выберите дату, время визита и количество гостей. Пожелания помогут
            подсветить наиболее подходящие столики.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="booking-search-form">
        <label>
          Дата
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Время визита
          <input
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Количество гостей
          <input
            type="number"
            name="guest_count"
            min="1"
            value={formData.guest_count}
            onChange={handleChange}
            required
          />
        </label>

        <div className="booking-preferences">
          <span className="booking-preferences-title">Пожелания к столику</span>

          <div className="booking-feature-pills">
            {features.length ? (
              features.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  className={`booking-feature-pill ${
                    formData.features.includes(String(feature.id)) ? 'active' : ''
                  }`}
                  onClick={() => handleFeatureToggle(feature.id)}
                >
                  {feature.name}
                </button>
              ))
            ) : (
              <p className="booking-preferences-empty">
                Пожелания пока не добавлены.
              </p>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary booking-search-submit" disabled={loading}>
          {loading ? 'Ищем столики...' : 'Найти столики'}
        </button>
      </form>
    </section>
  )
}