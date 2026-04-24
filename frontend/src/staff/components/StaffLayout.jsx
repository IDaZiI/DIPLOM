import { Outlet } from 'react-router-dom'
import StaffNavbar from './StaffNavbar'

function StaffLayout() {
  return (
    <div>
      <StaffNavbar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  )
}

export default StaffLayout