import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import AvailabilityPage from './pages/AvailabilityPage'
import RecordsPage from './pages/RecordsPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/availability" replace />} />

      <Route
        path="/auth"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      <Route
        path="/availability"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AvailabilityPage />} />
      </Route>

      <Route
        path="/records"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RecordsPage />} />
      </Route>
    </Routes>
  )
}

export default App