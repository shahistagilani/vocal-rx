import { useState } from 'react'
import HomePage from './components/HomePage'
import RecordingPage from './components/RecordingPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'recording'>('home')

  const handleStartRecording = () => {
    setCurrentPage('recording')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  return (
    <>
      {currentPage === 'home' && (
        <HomePage onStartRecording={handleStartRecording} />
      )}
      {currentPage === 'recording' && (
        <RecordingPage onBackToHome={handleBackToHome} />
      )}
    </>
  )
}

export default App
