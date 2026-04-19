import { Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import AvailabilityPage from './pages/AvailabilityPage'
import RecordsPage from './pages/RecordsPage'
import Layout from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/availability" element={<AvailabilityPage />} />
        <Route path="/records" element={<RecordsPage />} />
      </Route>
    </Routes>
  )
}

export default App