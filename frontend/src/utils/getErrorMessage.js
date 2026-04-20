export function getErrorMessage(data, fallback = 'Не удалось выполнить действие.') {
  if (!data) {
    return fallback
  }

  if (typeof data === 'string') {
    return data
  }

  if (data.non_field_errors?.length) {
    return data.non_field_errors[0]
  }

  if (data.detail) {
    return data.detail
  }

  const firstKey = Object.keys(data)[0]
  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
    return data[firstKey][0]
  }

  return fallback
}