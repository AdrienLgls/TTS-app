import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'
import LandingPage from './components/LandingPage'
import TTSInterface from './components/TTSInterface'
import Login from './components/Login'
import Register from './components/Register'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<TTSApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
