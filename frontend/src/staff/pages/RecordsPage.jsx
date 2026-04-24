import '../../shared/styles/content-blocks.css'
import "./RecordsPage.css"
import AvailabilityList from '../components/AvailabilityList'

function RecordsPage() {
  return (
    <div>
      <h1 className="page-title">Мои записи</h1>
      <p className="page-subtitle">
        Здесь отображаются все добавленные интервалы доступности.
      </p>

      <AvailabilityList />
    </div>
  )
}

export default RecordsPage