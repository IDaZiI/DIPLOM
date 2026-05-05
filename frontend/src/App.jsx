import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './auth/pages/AuthPage'
import AvailabilityPage from './staff/pages/AvailabilityPage'
import RecordsPage from './staff/pages/RecordsPage'
import BookingPage from './booking/pages/BookingPage'
import AdminTablesPage from './admin/pages/AdminTablesPage'
import AdminSettingsPage from './admin/pages/AdminSettingsPage'
import StaffLayout from './staff/components/StaffLayout'
import ProtectedRoute from './shared/components/ProtectedRoute'
import PublicRoute from './shared/components/PublicRoute'
import AdminLayout from './admin/components/AdminLayout'
import AdminReservationsPage from './admin/pages/AdminReservationsPage'
import MyReservationPage from './booking/pages/MyReservationPage'
import AdminWaitersPage from './admin/pages/AdminWaitersPage'
import MyShiftsPage from './staff/pages/MyShiftsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/booking" replace />} />

      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      <Route path="/booking" element={<BookingPage />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={['waiter']}>
            <StaffLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/my-shifts" element={<MyShiftsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/booking" replace />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/tables" element={<AdminTablesPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
         <Route path="/admin/reservations" element={<AdminReservationsPage />} />
         <Route path="/admin/waiters" element={<AdminWaitersPage />} />
      </Route>
     
     <Route path="/my-reservation" element={<MyReservationPage />} />
    </Routes>
    )
}

export default App