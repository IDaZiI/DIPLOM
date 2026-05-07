import { useEffect } from 'react'

export default function AppToast({
  error,
  successMessage,
  onClearError,
  onClearSuccess,
  duration = 4000,
}) {
  useEffect(() => {
    if (!error && !successMessage) return undefined

    const timer = setTimeout(() => {
      onClearError?.()
      onClearSuccess?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [error, successMessage, duration, onClearError, onClearSuccess])

  if (!error && !successMessage) return null

  return (
    <div className="app-toast">
      {error && (
        <div className="app-toast-message error">
          <span>{error}</span>

          <button
            type="button"
            onClick={onClearError}
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="app-toast-message success">
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={onClearSuccess}
            aria-label="Закрыть уведомление"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}