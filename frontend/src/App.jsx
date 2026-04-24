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
      </Route>

      <Route
        path="/admin/tables"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminTablesPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/booking" replace />} />

      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App