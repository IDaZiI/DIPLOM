import AvailabilityList from '../components/AvailabilityList'

function RecordsPage() {
  return (
    <div>
      <h1>Мои записи</h1>
      <p>Здесь отображаются все добавленные интервалы доступности.</p>
      <AvailabilityList />
    </div>
  )
}

export default RecordsPage