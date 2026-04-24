import WeeklyCalendar from '../components/WeeklyCalendar'

function AvailabilityPage() {
  return (
    <div>
      <h1 className="page-title">Моя доступность</h1>
      <p className="page-subtitle">
        Выберите день и временной интервал в недельном календаре, чтобы указать доступность.
      </p>

      <WeeklyCalendar />
    </div>
  )
}

export default AvailabilityPage