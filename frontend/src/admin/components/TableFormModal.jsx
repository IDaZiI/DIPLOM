import Modal from '../../shared/components/Modal'
import TableForm from './TableForm'

export default function TableFormModal({
  isOpen,
  selectedTable,
  presetPosition,
  features,
  onSubmit,
  onClose,
  loading,
}) {
  if (!isOpen) return null

  return (
    <Modal
      title={selectedTable ? 'Редактирование столика' : 'Добавление столика'}
      onClose={onClose}
      isLoading={loading}
      maxWidth={760}
    >
      <TableForm
        key={
          selectedTable
            ? `edit-${selectedTable.id}`
            : `new-${presetPosition.x}-${presetPosition.y}`
        }
        selectedTable={selectedTable}
        presetPosition={presetPosition}
        features={features}
        onSubmit={onSubmit}
        onCancelEdit={onClose}
        loading={loading}
      />
    </Modal>
  )
}