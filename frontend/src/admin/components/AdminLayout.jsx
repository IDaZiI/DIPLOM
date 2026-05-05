import { Outlet } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'
import '../../shared/styles/admin-theme.css'

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-main page-container">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout