import { useState } from 'react'
import './App.css'
import TTSInterface from './components/TTSInterface'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Kokoro TTS</h1>
        <p>Synthèse vocale de qualité avec l'IA</p>
      </header>
      
      <main className="App-main">
        <TTSInterface />
      </main>
      
      <footer className="App-footer">
        <p>Propulsé par Kokoro-82M</p>
      </footer>
    </div>
  )
}

export default App
