export function getStartOfWeek(date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function getWeekDays(date) {
  const start = getStartOfWeek(date)

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
}

export function formatDayLabel(date) {
  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function generateTimeSlots(startHour = 8, endHour = 22, stepMinutes = 30) {
  const slots = []

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += stepMinutes) {
      if (hour === endHour && minutes > 0) break

      const formattedHour = String(hour).padStart(2, '0')
      const formattedMinutes = String(minutes).padStart(2, '0')
      slots.push(`${formattedHour}:${formattedMinutes}`)
    }
  }

  return slots
}

export function isPastDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  return compareDate < today
}

export function isToday(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  return compareDate.getTime() === today.getTime()
}