import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import FeaturesPage from './pages/FeaturesPage'
import AuthCallback from './pages/AuthCallback'
import SuccessPage from './pages/SuccessPage'
import SimplifiedLoginPage from './pages/SimplifiedLoginPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<SimplifiedLoginPage />} />
            <Route path="/login/original" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
