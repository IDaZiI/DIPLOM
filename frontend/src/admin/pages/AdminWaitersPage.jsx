import { useEffect, useState } from 'react'
import Modal from '../../shared/components/Modal'
import {
  createWaiter,
  deleteWaiter,
  getWaiters,
  updateWaiter,
} from '../../api/availability'
import './AdminWaitersPage.css'

const initialForm = {
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  password2: '',
}

const getEmployeeName = (employee) => {
  if (!employee) return ''

  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim()
  return fullName || employee.username
}

const getBackendErrorMessage = (err, fallbackMessage) => {
  const backendError = err.response?.data

  if (typeof backendError === 'string') {
    return backendError
  }

  if (backendError?.detail) {
    return backendError.detail
  }

  if (backendError?.non_field_errors) {
    return backendError.non_field_errors.join(' ')
  }

  if (backendError && typeof backendError === 'object') {
    const messages = Object.entries(backendError)
      .flatMap(([field, value]) => {
        const text = Array.isArray(value) ? value.join(' ') : value
        return `${field}: ${text}`
      })
      .filter(Boolean)

    if (messages.length) {
      return messages.join(' ')
    }
  }

  return fallbackMessage
}

export default function AdminWaitersPage() {
  const [waiters, setWaiters] = useState([])
  const [formData, setFormData] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [employeeToToggle, setEmployeeToToggle] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadEmployees = async () => {
    setLoading(true)

    try {
      const response = await getWaiters()
      setWaiters(response.data)
      setError('')
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить список сотрудников.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const handleOpenCreateModal = () => {
    setFormData(initialForm)
    setError('')
    setSuccessMessage('')
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    if (creating) return

    setIsCreateModalOpen(false)
    setFormData(initialForm)
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setCreating(true)
    setError('')
    setSuccessMessage('')

    try {
      await createWaiter(formData)
      setFormData(initialForm)
      setIsCreateModalOpen(false)
      setSuccessMessage('Учётная запись сотрудника создана.')
      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось создать учётную запись сотрудника.'
        )
      )
    } finally {
      setCreating(false)
    }
  }

  const handleAskToggleEmployeeStatus = (employee) => {
    setEmployeeToToggle(employee)
    setError('')
    setSuccessMessage('')
  }

  const handleConfirmToggleEmployeeStatus = async () => {
    if (!employeeToToggle) return

    const newStatus = !employeeToToggle.is_active

    setUpdatingId(employeeToToggle.id)
    setError('')
    setSuccessMessage('')

    try {
      await updateWaiter(employeeToToggle.id, {
        is_active: newStatus,
      })

      setSuccessMessage(
        newStatus
          ? 'Учётная запись сотрудника активирована.'
          : 'Учётная запись сотрудника деактивирована.'
      )

      setEmployeeToToggle(null)
      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось изменить состояние учётной записи сотрудника.'
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStartEdit = (employee) => {
    setEditingId(employee.id)
    setEditFormData({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
    })
    setError('')
    setSuccessMessage('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditFormData({
      first_name: '',
      last_name: '',
      email: '',
    })
  }

  const handleEditFormChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveEmployee = async (employee) => {
    setUpdatingId(employee.id)
    setError('')
    setSuccessMessage('')

    try {
      await updateWaiter(employee.id, editFormData)

      setSuccessMessage('Данные сотрудника обновлены.')
      setEditingId(null)
      setEditFormData({
        first_name: '',
        last_name: '',
        email: '',
      })

      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось обновить данные сотрудника.'
        )
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAskDeleteEmployee = (employee) => {
    setEmployeeToDelete(employee)
    setError('')
    setSuccessMessage('')
  }

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return

    setDeletingId(employeeToDelete.id)
    setError('')
    setSuccessMessage('')

    try {
      await deleteWaiter(employeeToDelete.id)

      if (editingId === employeeToDelete.id) {
        handleCancelEdit()
      }

      setSuccessMessage('Сотрудник удалён.')
      setEmployeeToDelete(null)
      await loadEmployees()
    } catch (err) {
      console.error(err)

      setError(
        getBackendErrorMessage(
          err,
          'Не удалось удалить сотрудника.'
        )
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="admin-page admin-waiters-page">
      <section className="admin-page-hero admin-waiters-hero">
        <div>
          <span className="admin-page-badge">Панель администратора</span>

          <h1 className="admin-page-title">Сотрудники</h1>

          <p className="admin-page-description">
            Управляйте учётными записями сотрудников, редактируйте данные и доступ к системе.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn primary"
          onClick={handleOpenCreateModal}
        >
          Создать сотрудника
        </button>
      </section>

      {error && <p className="admin-message error">{error}</p>}
      {successMessage && <p className="admin-message success">{successMessage}</p>}

      {isCreateModalOpen && (
        <Modal
          title="Создание сотрудника"
          onClose={handleCloseCreateModal}
          isLoading={creating}
          maxWidth={720}
        >
          <form className="waiter-form waiter-modal-form" onSubmit={handleSubmit}>
            <label>
              Логин
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                required
              />
            </label>

            <label>
              Имя
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleChange('first_name', e.target.value)}
              />
            </label>

            <label>
              Фамилия
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </label>

            <label>
              Пароль
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
              />
            </label>

            <label>
              Повторите пароль
              <input
                type="password"
                value={formData.password2}
                onChange={(e) => handleChange('password2', e.target.value)}
                required
              />
            </label>

            <div className="waiter-modal-actions">
              <button
                type="submit"
                className="admin-btn primary"
                disabled={creating}
              >
                {creating ? 'Создание...' : 'Создать сотрудника'}
              </button>

              <button
                type="button"
                className="admin-btn secondary"
                onClick={handleCloseCreateModal}
                disabled={creating}
              >
                Отмена
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="admin-waiters-layout">
        <section className="admin-card waiters-list-card">
          <div className="waiters-list-card-header">
            <div>
              <h2 className="admin-section-title">Список сотрудников</h2>
              <p className="admin-subtitle">
                Редактируйте данные, управляйте активностью или удаляйте учётные записи.
              </p>
            </div>
          </div>

          {loading ? (
            <p>Загрузка сотрудников...</p>
          ) : waiters.length ? (
            <div className="waiters-list">
              {waiters.map((employee) => {
                const isEditing = editingId === employee.id
                const isBusy = updatingId === employee.id || deletingId === employee.id

                return (
                  <div key={employee.id} className="waiter-item">
                    {isEditing ? (
                      <div className="waiter-edit-form">
                        <label>
                          Имя
                          <input
                            type="text"
                            value={editFormData.first_name}
                            onChange={(e) =>
                              handleEditFormChange('first_name', e.target.value)
                            }
                          />
                        </label>

                        <label>
                          Фамилия
                          <input
                            type="text"
                            value={editFormData.last_name}
                            onChange={(e) =>
                              handleEditFormChange('last_name', e.target.value)
                            }
                          />
                        </label>

                        <label>
                          Email
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) =>
                              handleEditFormChange('email', e.target.value)
                            }
                          />
                        </label>

                        <p className="waiter-login-hint">
                          Логин: @{employee.username}
                        </p>
                      </div>
                    ) : (
                      <div className="waiter-info">
                        <strong>{getEmployeeName(employee)}</strong>

                        <p>@{employee.username}</p>

                        {employee.email && <p>{employee.email}</p>}
                      </div>
                    )}

                    <div className="waiter-actions">
                      <span
                        className={`waiter-status ${
                          employee.is_active ? 'active' : 'inactive'
                        }`}
                      >
                        {employee.is_active ? 'Активен' : 'Деактивирован'}
                      </span>

                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn primary"
                            onClick={() => handleSaveEmployee(employee)}
                            disabled={isBusy}
                          >
                            Сохранить
                          </button>

                          <button
                            type="button"
                            className="admin-btn secondary"
                            onClick={handleCancelEdit}
                            disabled={isBusy}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="admin-btn secondary waiter-edit-btn"
                            onClick={() => handleStartEdit(employee)}
                            disabled={isBusy}
                          >
                            Редактировать
                          </button>

                          <button
                            type="button"
                            className={
                              employee.is_active
                                ? 'admin-btn warning waiter-toggle-btn'
                                : 'admin-btn success waiter-toggle-btn'
                            }
                            onClick={() => handleAskToggleEmployeeStatus(employee)}
                            disabled={isBusy}
                          >
                            {employee.is_active ? 'Деактивировать' : 'Активировать'}
                          </button>

                          <button
                            type="button"
                            className="admin-btn danger waiter-delete-btn"
                            onClick={() => handleAskDeleteEmployee(employee)}
                            disabled={isBusy}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p>Сотрудники пока не добавлены.</p>
          )}
        </section>
      </div>

      {employeeToToggle && (
        <Modal
          title={
            employeeToToggle.is_active
              ? 'Деактивировать сотрудника?'
              : 'Активировать сотрудника?'
          }
          onClose={() => setEmployeeToToggle(null)}
          isLoading={updatingId === employeeToToggle.id}
          maxWidth={520}
        >
          <div className="waiter-confirm-modal">
            <div
              className={
                employeeToToggle.is_active
                  ? 'waiter-confirm-icon warning'
                  : 'waiter-confirm-icon success'
              }
            >
              {employeeToToggle.is_active ? '!' : '✓'}
            </div>

            <p>
              {employeeToToggle.is_active
                ? 'После деактивации сотрудник не сможет пользоваться системой.'
                : 'После активации сотрудник снова сможет пользоваться системой.'}
            </p>

            <p className="waiter-confirm-name">
              {getEmployeeName(employeeToToggle)}
            </p>

            <div className="waiter-confirm-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setEmployeeToToggle(null)}
                disabled={updatingId === employeeToToggle.id}
              >
                Отмена
              </button>

              <button
                type="button"
                className={
                  employeeToToggle.is_active
                    ? 'admin-btn warning'
                    : 'admin-btn success'
                }
                onClick={handleConfirmToggleEmployeeStatus}
                disabled={updatingId === employeeToToggle.id}
              >
                {updatingId === employeeToToggle.id
                  ? 'Сохранение...'
                  : employeeToToggle.is_active
                    ? 'Деактивировать'
                    : 'Активировать'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {employeeToDelete && (
        <Modal
          title="Удалить сотрудника?"
          onClose={() => setEmployeeToDelete(null)}
          isLoading={deletingId === employeeToDelete.id}
          maxWidth={520}
        >
          <div className="waiter-confirm-modal">
            <div className="waiter-confirm-icon danger">×</div>

            <p>
              Сотрудник будет удалён из системы. Это действие нельзя отменить.
            </p>

            <p className="waiter-confirm-name">
              {getEmployeeName(employeeToDelete)}
            </p>

            <div className="waiter-confirm-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setEmployeeToDelete(null)}
                disabled={deletingId === employeeToDelete.id}
              >
                Отмена
              </button>

              <button
                type="button"
                className="admin-btn danger"
                onClick={handleDeleteEmployee}
                disabled={deletingId === employeeToDelete.id}
              >
                {deletingId === employeeToDelete.id ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
