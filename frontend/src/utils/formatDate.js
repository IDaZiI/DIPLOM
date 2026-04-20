export function formatDate(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}