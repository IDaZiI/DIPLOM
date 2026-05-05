import { useEffect, useState } from 'react'
import WeeklyCalendar from '../components/WeeklyCalendar'
import { getCurrentUser } from '../../api/availability'
import './AvailabilityPage.css'

function AvailabilityPage() {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error('Не удалось загрузить данные пользователя:', error)
      }
    }

    loadCurrentUser()
  }, [])

  const displayName =
    currentUser?.full_name ||
    currentUser?.first_name ||
    currentUser?.username ||
    'Сотрудник'

  const username = currentUser?.username ? `@${currentUser.username}` : ''
  const email = currentUser?.email || ''
  const roleLabel = 'Сотрудник'

  return (
    <div className="availability-page">
      <section className="availability-hero">
        <div className="availability-hero-grid">
          <div className="availability-hero-content">
            <span className="availability-hero-label">Личный кабинет сотрудника</span>

            <h1 className="availability-title">Моя доступность</h1>

            <p className="availability-subtitle">
              Укажите интервалы, в которые вы готовы выйти на смену. Данные
              доступности используются при формировании расписания сотрудников.
            </p>
          </div>

          <div className="availability-profile-card">
            <h3>{displayName}</h3>

            {username && <p>{username}</p>}
            {email && <p>{email}</p>}

            <span>{roleLabel}</span>
          </div>
        </div>
      </section>

      <section className="availability-section">
        <div className="availability-section-header">
          <div>
            <h2>Календарь доступности</h2>
            <p>
              Выберите день и временной интервал в недельном календаре, чтобы
              указать доступность.
            </p>
          </div>
        </div>

        <WeeklyCalendar />
      </section>
    </div>
  )
}

export default AvailabilityPage