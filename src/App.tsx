import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import RecordingPage from './components/RecordingPage';
import PrescriptionPreview from './components/PrescriptionPreview';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePageWrapper />} />
        <Route path="/record" element={<RecordingPageWrapper />} />
        <Route path="/prescription-preview" element={<PrescriptionPreview />} />
      </Routes>
    </Router>
  );
}

// Wrapper components to handle navigation
function HomePageWrapper() {
  const navigate = useNavigate();
  return <HomePage onStartRecording={() => navigate('/record')} />;
}

function RecordingPageWrapper() {
  const navigate = useNavigate();
  return <RecordingPage onBackToHome={() => navigate('/')} />;
}

export default App;
