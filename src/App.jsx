import { Routes, Route, Navigate } from 'react-router-dom'
import SetupPage from './pages/SetupPage'
import PracticePage from './pages/PracticePage'
import DashboardPage from './pages/DashboardPage'
import ProblemsListPage from './pages/ProblemsListPage'
import AssessmentPage from './pages/AssessmentPage'
import WeekendChallengePage from './pages/WeekendChallengePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import Navbar from './components/Navbar'
import { useAuth } from './context/AuthContext'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireAssessment({ children }) {
  const assessed = localStorage.getItem('codegen_assessed')
  if (!assessed) return <Navigate to="/assessment" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/assessment" element={
          <RequireAuth>
            <AssessmentPage />
          </RequireAuth>
        } />
        <Route path="/weekend-challenge" element={
          <RequireAuth>
            <RequireAssessment>
              <WeekendChallengePage />
            </RequireAssessment>
          </RequireAuth>
        } />
        <Route path="/" element={
          <RequireAuth>
            <RequireAssessment>
              <SetupPage />
            </RequireAssessment>
          </RequireAuth>
        } />
        <Route path="/problems" element={
          <RequireAuth>
            <RequireAssessment>
              <ProblemsListPage />
            </RequireAssessment>
          </RequireAuth>
        } />
        <Route path="/practice" element={
          <RequireAuth>
            <RequireAssessment>
              <PracticePage />
            </RequireAssessment>
          </RequireAuth>
        } />
        <Route path="/dashboard" element={
          <RequireAuth>
            <RequireAssessment>
              <DashboardPage />
            </RequireAssessment>
          </RequireAuth>
        } />
      </Routes>
    </div>
  )
}