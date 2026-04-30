import Modal from '../../shared/components/Modal'

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = 'Удалить',
  loadingText = 'Удаление...',
  cancelText = 'Отмена',
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      isLoading={isLoading}
      maxWidth={450}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? loadingText : confirmText}
          </button>
        </>
      }
    >
      <p className="modal-text">{message}</p>
    </Modal>
  )
}

export default ConfirmModal