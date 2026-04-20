function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-text">{message}</p>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Отмена
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal