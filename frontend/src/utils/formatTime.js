export function formatTime(timeString) {
  if (!timeString) return ''

  return timeString.slice(0, 5)
}