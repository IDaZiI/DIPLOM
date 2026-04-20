import AvailabilityForm from '../components/AvailabilityForm'

function AvailabilityPage() {
  return (
    <div>
      <h1 className="page-title">Моя доступность</h1>
      <p className="page-subtitle">
        Укажите дату и время, когда вы можете работать.
      </p>

      <div className="card form-card">
        <AvailabilityForm />
      </div>
    </div>
  )
}

export default AvailabilityPage