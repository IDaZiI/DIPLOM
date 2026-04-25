import { Outlet } from 'react-router-dom'
import AdminNavbar from './AdminNavbar'

function AdminLayout() {
  return (
    <div>
      <AdminNavbar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout