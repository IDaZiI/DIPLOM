import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import AvailabilityPage from './pages/AvailabilityPage'
import RecordsPage from './pages/RecordsPage'
import BookingPage from './pages/BookingPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminTablesPage from './pages/AdminTablesPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

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
        path="/availability"
        element={
          <ProtectedRoute allowedRoles={['waiter']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AvailabilityPage />} />
      </Route>

      <Route
        path="/records"
        element={
          <ProtectedRoute allowedRoles={['waiter']}>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RecordsPage />} />
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