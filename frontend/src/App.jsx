import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import LandingPage from './components/LandingPage'
import TTSInterface from './components/TTSInterface'
import Login from './components/Login'
import Register from './components/Register'
import ProtectedRoute from './components/ProtectedRoute'
import PremiumUpgrade from './components/PremiumUpgrade'
import PaymentSuccess from './components/PaymentSuccess'
import PaymentCancel from './components/PaymentCancel'
import VoiceCloning from './components/VoiceCloning'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<TTSApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/premium" element={<PremiumUpgrade />} />
          <Route path="/success" element={<PaymentSuccess />} />
          <Route path="/cancel" element={<PaymentCancel />} />
          <Route path="/voice-cloning" element={<VoiceCloning />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

// Composant pour l'application TTS (ancienne version d'App)
function TTSApp() {
  return (
    <div style={{padding: '2rem'}}>
      <h1>Test TTS App</h1>
      <p>Si tu vois ce message, la navigation fonctionne !</p>
      <TTSInterface />
    </div>
  )
}

export default App
