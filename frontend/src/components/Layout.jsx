import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

function Layout() {
  return (
    <div>
      <Navbar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout