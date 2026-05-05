import '../../shared/styles/content-blocks.css'
import './RecordsPage.css'
import AvailabilityList from '../components/AvailabilityList'

function RecordsPage() {
  return (
    <div className="records-page">
      <section className="records-hero">
        <div>
          <span className="records-hero-label">Личный кабинет сотрудника</span>
          <h1 className="page-title">Мои записи</h1>
          <p className="page-subtitle">
            Здесь отображаются добавленные интервалы доступности. Актуальные записи
            можно изменить, а прошедшие остаются в архиве для просмотра.
          </p>
        </div>
      </section>

      <AvailabilityList />
    </div>
  )
}

export default RecordsPage