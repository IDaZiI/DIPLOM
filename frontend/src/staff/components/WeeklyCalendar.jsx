import "./WeeklyCalendar.css"
import { useEffect, useMemo, useState } from 'react'
import { getAvailabilities, getMyConfirmedShifts } from '../../api/availability'
import {
  getWeekDays,
  formatDayLabel,
  generateTimeSlots,
  toISODate,
  isPastDate,
  isToday,
} from '../../utils/calendar'
import { formatTime } from '../../utils/formatTime'
import SlotFormModal from './SlotFormModal'
import EditSlotModal from './EditSlotModal'

function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedCell, setSelectedCell] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [records, setRecords] = useState([])
  const [confirmedShifts, setConfirmedShifts] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate])
  const timeSlots = useMemo(() => generateTimeSlots(), [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [availabilityResponse, shiftsResponse] = await Promise.all([
          getAvailabilities(),
          getMyConfirmedShifts(),
        ])

        setRecords(availabilityResponse.data)
        setConfirmedShifts(shiftsResponse.data)
      } catch (err) {
        console.error('Ошибка при загрузке данных календаря:', err)
      }
    }

    fetchData()
  }, [refreshKey])

  const goToPreviousWeek = () => {
    const prev = new Date(currentDate)
    prev.setDate(prev.getDate() - 7)
    setCurrentDate(prev)
  }

  const goToNextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(next.getDate() + 7)
    setCurrentDate(next)
  }

  const visibleRecords = useMemo(() => {
    const weekDates = weekDays.map((day) => toISODate(day))
    return records.filter((record) => weekDates.includes(record.date))
  }, [records, weekDays])

  const confirmedShiftByAvailabilityId = useMemo(() => {
    const map = {}

    confirmedShifts.forEach((shift) => {
      if (shift.availability) {
        map[shift.availability] = shift
      }
    })

    return map
  }, [confirmedShifts])

  const isCellOccupied = (date, time) => {
    const isoDate = toISODate(date)

    return visibleRecords.some((record) => {
      if (record.date !== isoDate) return false

      const recordStart = formatTime(record.start_time)
      const recordEnd = formatTime(record.end_time)

      return time >= recordStart && time < recordEnd
    })
  }

  const handleCellClick = (date, time) => {
    if (isPastDate(date)) return
    if (isCellOccupied(date, time)) return

    setSelectedRecord(null)
    setSelectedCell({
      date: toISODate(date),
      time,
    })
  }

  const handleRecordClick = (record) => {
    const shift = confirmedShiftByAvailabilityId[record.id]

    if (shift) {
      return
    }

    if (isPastRecordDate(record.date)) {
      return
    }

    setSelectedCell(null)
    setSelectedRecord(record)
  }

  const handleCloseCreateModal = () => {
    setSelectedCell(null)
  }

  const handleCloseEditModal = () => {
    setSelectedRecord(null)
  }

  const handleSaved = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const getRecordBlockPosition = (record) => {
    const dayIndex = weekDays.findIndex((day) => toISODate(day) === record.date)
    const startIndex = timeSlots.indexOf(formatTime(record.start_time))
    const endIndex = timeSlots.indexOf(formatTime(record.end_time))

    if (dayIndex === -1 || startIndex === -1 || endIndex === -1) {
      return null
    }

    return {
      gridColumn: dayIndex + 2,
      gridRow: `${startIndex + 1} / ${endIndex + 1}`,
    }
  }

  const getTodayISO = () => {
    const now = new Date()
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    return localDate.toISOString().split('T')[0]
  }

  const getConfirmedShiftStatus = (shift) => {
    if (!shift) return null

    if (shift.date < getTodayISO()) {
      return 'completed'
    }

    return 'planned'
  }

  const isPastRecordDate = (date) => {
    return date < getTodayISO()
  }

  const getRecordBlockClassName = (record) => {
    const shift = confirmedShiftByAvailabilityId[record.id]
    const status = getConfirmedShiftStatus(shift)

    if (status === 'completed') {
      return 'calendar-record-block calendar-record-block-completed'
    }

    if (status === 'planned') {
      return 'calendar-record-block calendar-record-block-confirmed'
    }

    if (isPastRecordDate(record.date)) {
      return 'calendar-record-block calendar-record-block-disabled'
    }

    return 'calendar-record-block'
  }

  const getRecordBlockLabel = (record) => {
    const shift = confirmedShiftByAvailabilityId[record.id]
    const status = getConfirmedShiftStatus(shift)

    if (status === 'completed') {
      return 'Отработана'
    }

    if (status === 'planned') {
      return 'Подтверждена'
    }

    return 'Доступность'
  }

  return (
    <div className="weekly-calendar card">
      <div className="calendar-legend">
        <div className="calendar-legend-item">
          <span className="calendar-legend-dot availability"></span>
          <span>Доступность</span>
        </div>

        <div className="calendar-legend-item">
          <span className="calendar-legend-dot confirmed"></span>
          <span>Подтверждённая смена</span>
        </div>

        <div className="calendar-legend-item">
          <span className="calendar-legend-dot completed"></span>
          <span>Отработанная смена</span>
        </div>

        <p className="calendar-legend-note">
          Подтверждённые и отработанные смены недоступны для редактирования.
        </p>
      </div>

      <div className="calendar-toolbar">
        <button className="btn btn-secondary" onClick={goToPreviousWeek}>
          ← Неделя назад
        </button>
        <button className="btn btn-secondary" onClick={goToNextWeek}>
          Неделя вперёд →
        </button>
      </div>

      <div className="calendar-wrapper">
        <div className="calendar-header-row">
          <div className="calendar-cell calendar-time-header"></div>

          {weekDays.map((day) => {
            const isDisabledDay = isPastDate(day)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`calendar-cell calendar-header-cell ${
                  isDisabledDay ? 'calendar-day-disabled' : ''
                } ${isCurrentDay ? 'calendar-day-today' : ''}`}
              >
                {formatDayLabel(day)}
              </div>
            )
          })}
        </div>

        <div className="calendar-body-wrapper">
          <div className="calendar-body-grid">
            {timeSlots.map((time, timeIndex) => (
              <div key={`time-${time}`} className="calendar-row-fragment">
                <div
                  className="calendar-cell calendar-time-cell"
                  style={{ gridColumn: 1, gridRow: timeIndex + 1 }}
                >
                  {time}
                </div>

                {weekDays.map((day, dayIndex) => {
                  const isoDate = toISODate(day)
                  const isSelected =
                    selectedCell?.date === isoDate && selectedCell?.time === time
                  const isDisabledDay = isPastDate(day)
                  const isCurrentDay = isToday(day)

                  return (
                    <button
                      key={`${isoDate}-${time}-${refreshKey}`}
                      type="button"
                      className={`calendar-cell calendar-slot ${
                        isSelected ? 'calendar-slot-selected' : ''
                      } ${isDisabledDay ? 'calendar-slot-disabled' : ''} ${
                        isCurrentDay ? 'calendar-slot-today' : ''
                      }`}
                      style={{
                        gridColumn: dayIndex + 2,
                        gridRow: timeIndex + 1,
                      }}
                      onClick={() => handleCellClick(day, time)}
                      disabled={isDisabledDay}
                    />
                  )
                })}
              </div>
            ))}
          </div>

          <div className="calendar-records-layer">
            {visibleRecords.map((record) => {
              const position = getRecordBlockPosition(record)
              if (!position) return null

              return (
                <button
                  key={record.id}
                  type="button"
                  className={getRecordBlockClassName(record)}
                  style={position}
                  onClick={() => handleRecordClick(record)}
                  title={
                    confirmedShiftByAvailabilityId[record.id]
                      ? 'Эта доступность уже подтверждена как смена и недоступна для редактирования'
                      : getRecordBlockLabel(record)
                  }
                >
                  <span className="calendar-record-block-label">
                    {getRecordBlockLabel(record)}
                  </span>

                  <span className="calendar-record-block-time">
                    {formatTime(record.start_time)} — {formatTime(record.end_time)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {selectedCell && (
        <SlotFormModal
          key={`${selectedCell.date}-${selectedCell.time}`}
          selectedCell={selectedCell}
          timeSlots={timeSlots}
          onClose={handleCloseCreateModal}
          onSaved={handleSaved}
        />
      )}

      {selectedRecord && (
        <EditSlotModal
          key={selectedRecord.id}
          record={selectedRecord}
          timeSlots={timeSlots}
          onClose={handleCloseEditModal}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

export default WeeklyCalendar