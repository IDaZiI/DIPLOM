import { useEffect } from 'react'

function ConfirmModal({ title, message, onConfirm, onCancel, isLoading = false }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel, isLoading])

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget && !isLoading) {
      onCancel()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-text">{message}</p>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            Отмена
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal