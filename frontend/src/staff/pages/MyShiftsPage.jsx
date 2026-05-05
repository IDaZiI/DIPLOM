import { useEffect, useMemo, useState } from 'react'
import { getMyConfirmedShifts } from '../../api/availability'
import { formatDate } from '../../utils/formatDate'
import { formatTime } from '../../utils/formatTime'
import './MyShiftsPage.css'

const getTodayISO = () => {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localDate.toISOString().split('T')[0]
}

const getDurationText = (hoursValue) => {
  const hours = Number(hoursValue || 0)

  if (!hours) {
    return '0 ч'
  }

  if (Number.isInteger(hours)) {
    return `${hours} ч`
  }

  const fullHours = Math.floor(hours)
  const minutes = Math.round((hours - fullHours) * 60)

  if (!fullHours) {
    return `${minutes} мин`
  }

  return `${fullHours} ч ${minutes} мин`
}

function MyShiftsPage() {
  const [shifts, setShifts] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const today = getTodayISO()

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const response = await getMyConfirmedShifts()

        const sortedShifts = [...response.data].sort((a, b) => {
          if (a.date !== b.date) {
            return a.date.localeCompare(b.date)
          }

          return formatTime(a.start_time).localeCompare(formatTime(b.start_time))
        })

        setShifts(sortedShifts)
      } catch (err) {
        console.error(err)
        setError('Не удалось загрузить подтверждённые смены.')
      } finally {
        setLoading(false)
      }
    }

    loadShifts()
  }, [])

  const upcomingShifts = useMemo(
    () => shifts.filter((shift) => shift.date >= today),
    [shifts, today]
  )

  const pastShifts = useMemo(
    () => shifts.filter((shift) => shift.date < today),
    [shifts, today]
  )

  const visibleShifts = activeTab === 'upcoming' ? upcomingShifts : pastShifts

  const totalUpcomingHours = useMemo(
    () =>
      upcomingShifts.reduce(
        (sum, shift) => sum + Number(shift.duration_hours || 0),
        0
      ),
    [upcomingShifts]
  )

  const totalPastHours = useMemo(
    () =>
      pastShifts.reduce(
        (sum, shift) => sum + Number(shift.duration_hours || 0),
        0
      ),
    [pastShifts]
  )

  if (loading) {
    return (
      <div className="my-shifts-page">
        <section className="shifts-state-card">
          <h2>Загрузка смен...</h2>
          <p>Получаем список подтверждённых смен.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="my-shifts-page">
      <section className="shifts-hero">
        <div>
          <span className="shifts-hero-label">Личный кабинет сотрудника</span>
          <h1>Мои смены</h1>
          <p>
            Здесь отображаются подтверждённые рабочие смены. Они могут быть
            назначены вручную администратором или получены из модуля
            формирования расписания.
          </p>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {!error && (
        <>
          <section className="shifts-summary-grid">
            <div className="shift-summary-card">
              <span>Будущие смены</span>
              <strong>{upcomingShifts.length}</strong>
              <p>{getDurationText(totalUpcomingHours)}</p>
            </div>

            <div className="shift-summary-card">
              <span>Отработанные смены</span>
              <strong>{pastShifts.length}</strong>
              <p>{getDurationText(totalPastHours)}</p>
            </div>

            <div className="shift-summary-card">
              <span>Всего смен</span>
              <strong>{shifts.length}</strong>
              <p>{getDurationText(totalUpcomingHours + totalPastHours)}</p>
            </div>
          </section>

          <section className="shifts-panel">
            <div className="shifts-panel-header">
              <div>
                <h2>Подтверждённые смены</h2>
                <p>
                  Будущие смены отображаются отдельно от архива уже прошедших
                  смен.
                </p>
              </div>

              <div className="shifts-tabs">
                <button
                  type="button"
                  className={activeTab === 'upcoming' ? 'active' : ''}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Будущие
                  <span>{upcomingShifts.length}</span>
                </button>

                <button
                  type="button"
                  className={activeTab === 'past' ? 'active' : ''}
                  onClick={() => setActiveTab('past')}
                >
                  Архив
                  <span>{pastShifts.length}</span>
                </button>
              </div>
            </div>

            {visibleShifts.length === 0 ? (
              <div className="shifts-empty">
                {activeTab === 'upcoming' ? (
                  <>
                    <h3>Будущих смен пока нет</h3>
                    <p>
                      После назначения смены она появится в этом разделе.
                    </p>
                  </>
                ) : (
                  <>
                    <h3>Архив пока пуст</h3>
                    <p>
                      Здесь будут отображаться уже прошедшие подтверждённые смены.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="shifts-list">
                {visibleShifts.map((shift) => {
                  const isPast = shift.date < today

                  return (
                    <article
                      key={shift.id}
                      className={`shift-card ${isPast ? 'past' : ''}`}
                    >
                      <div className="shift-card-top">
                        <div>
                          <span className="shift-status">
                            {isPast ? 'Прошедшая смена' : 'Будущая смена'}
                          </span>

                          <h3>{formatDate(shift.date)}</h3>

                          <p className="shift-time">
                            {formatTime(shift.start_time)} — {formatTime(shift.end_time)}
                          </p>
                        </div>

                        <div className="shift-hours">
                          <span>Длительность</span>
                          <strong>{getDurationText(shift.duration_hours)}</strong>
                        </div>
                      </div>

                      <div className="shift-details">
                        <div>
                            <span>Зона</span>
                            <strong>{shift.zone_display || shift.zone}</strong>
                        </div>

                        {shift.actual_start_time &&
                            shift.actual_end_time &&
                            (
                            formatTime(shift.actual_start_time) !== formatTime(shift.start_time) ||
                            formatTime(shift.actual_end_time) !== formatTime(shift.end_time)
                            ) && (
                            <div>
                                <span>Фактическое время</span>
                                <strong>
                                {formatTime(shift.actual_start_time)} — {formatTime(shift.actual_end_time)}
                                </strong>
                            </div>
                            )}
                        </div>

                      {shift.note && (
                        <p className="shift-note">{shift.note}</p>
                      )}
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default MyShiftsPage