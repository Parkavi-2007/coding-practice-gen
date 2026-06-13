import { Routes, Route, Navigate } from 'react-router-dom'
import SetupPage from './pages/SetupPage'
import PracticePage from './pages/PracticePage'
import DashboardPage from './pages/DashboardPage'
import ProblemsListPage from './pages/ProblemsListPage'
import AssessmentPage from './pages/AssessmentPage'
import WeekendChallengePage from './pages/WeekendChallengePage'
import Navbar from './components/Navbar'

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
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/weekend-challenge" element={
          <RequireAssessment>
            <WeekendChallengePage />
          </RequireAssessment>
        } />
        <Route path="/" element={
          <RequireAssessment>
            <SetupPage />
          </RequireAssessment>
        } />
        <Route path="/problems" element={
          <RequireAssessment>
            <ProblemsListPage />
          </RequireAssessment>
        } />
        <Route path="/practice" element={
          <RequireAssessment>
            <PracticePage />
          </RequireAssessment>
        } />
        <Route path="/dashboard" element={
          <RequireAssessment>
            <DashboardPage />
          </RequireAssessment>
        } />
      </Routes>
    </div>
  )
}