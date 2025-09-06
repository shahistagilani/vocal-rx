import { useState, useRef } from 'react'
import { RecordingInterface } from './RecordingInterface'
import { useTimer } from '../hooks/useTimer'

interface RecordingPageProps {
  onBackToHome: () => void
}

export default function RecordingPage({ onBackToHome }: RecordingPageProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState<any>(null)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasExtracted, setHasExtracted] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const { time, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer()

  // Static prefilled data (Parts 1-3: Doctor, Clinic, Patient, Vitals)
  const staticData = {
    // Part 1: Doctor & Clinic Details (static per doctor)
    clinic_name: "Heart Care Clinic",
    clinic_tagline: "Comprehensive Cardiac Care",
    doctor_name: "Dr. Sarah Johnson",
    doctor_qualification: "MBBS, MD (Cardiology)",
    doctor_reg_no: "MH12345",
    clinic_address: "123 Medical Street, Mumbai 400001",
    clinic_timings: "9 AM - 6 PM, Closed on Sundays",
    clinic_phone: "+91-9876543210",
    
    // Part 2: Patient Profile (from appointment system)
    patient_id: "P001234",
    patient_name: "John Doe",
    patient_age: "45",
    patient_gender: "Male",
    patient_phone: "+91-9876543211",
    prescription_date: new Date().toLocaleDateString('en-IN'),
    
    // Part 3: Other Department Contributions (vitals, investigations)
    vitals_temp: "98.6°F",
    vitals_bp: "140/90 mmHg",
    vitals_height: "5'8\"",
    vitals_weight: "70kg",
    prescribed_investigations: ["ECG", "Cardiac enzymes", "Chest X-ray"]
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Create audio context for waveform visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        uploadAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimer()
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Error accessing microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
      stopTimer()
      
      // Stop all tracks to release microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }

  const restartRecording = () => {
    // Stop current recording if active
    if (isRecording) {
      stopRecording()
    }
    
    // Reset all states
    setTranscript('')
    setPrescriptionData(null)
    setEditedData(null)
    setHasExtracted(false)
    setIsExtracting(false)
    setShowTranscript(false)
    setIsProcessing(false)
    resetTimer()
    
    // Start new recording
    setTimeout(() => {
      startRecording()
    }, 100)
  }

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav',
        },
        body: audioBlob,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const data = await response.json()
      const transcribedText = data.transcript

      if (!transcribedText) {
        throw new Error('No transcript received')
      }
      
      setTranscript(prev => prev ? prev + '\n\n' + transcribedText : transcribedText)
      setShowTranscript(true)
      setIsProcessing(false)
    } catch (error) {
      console.error('Error transcribing audio:', error)
      setIsProcessing(false)
      alert('Error transcribing audio. Please check your connection and try again.')
    }
  }

  const extractPrescription = async () => {
    if (!transcript.trim()) {
      alert('No transcript available to extract prescription from.')
      return
    }

    setIsExtracting(true)
    
    try {
      const response = await fetch('/api/extract-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })

      if (!response.ok) {
        throw new Error('Prescription extraction failed')
      }

      const extractedData = await response.json()
      setPrescriptionData(extractedData)
      setEditedData({ ...extractedData })
      setHasExtracted(true)
    } catch (error) {
      console.error('Error extracting prescription:', error)
      alert('Error extracting prescription. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMedicineChange = (index: number, field: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      medicines: prev.medicines.map((med: any, i: number) => 
        i === index ? { ...med, [field]: value } : med
      )
    }))
  }

  const addMedicine = () => {
    setEditedData((prev: any) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          brand_name: '',
          generic_name: '',
          dosage: '',
          frequency: '',
          route: 'oral',
          duration: '',
          remarks: ''
        }
      ]
    }))
  }

  const removeMedicine = (index: number) => {
    setEditedData((prev: any) => ({
      ...prev,
      medicines: prev.medicines.filter((_: any, i: number) => i !== index)
    }))
  }

  const handleAdviceChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      advice: {
        ...prev.advice,
        [field]: value
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={onBackToHome}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Vocal<span className="text-orange-600">Rx</span>
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Recording Session
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Recording Interface */}
          <div className="space-y-6">
            {/* Recording Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Voice Recording</h2>
              
              {!isRecording && !isProcessing && !showTranscript && (
                <button
                  onClick={startRecording}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start Recording
                </button>
              )}

              {isRecording && (
                <RecordingInterface
                  isRecording={isRecording}
                  time={time}
                  onStop={stopRecording}
                  onRestart={restartRecording}
                  analyser={analyserRef.current}
                />
              )}

              {isProcessing && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing audio...</p>
                </div>
              )}
            </div>

            {/* Transcript */}
            {showTranscript && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={restartRecording}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Record Again
                    </button>
                    <button
                      onClick={extractPrescription}
                      disabled={isExtracting}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isExtracting ? 'Extracting...' : 'Extract Prescription'}
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Prescription Form */}
          <div className="space-y-6">
            {hasExtracted && editedData && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Extracted Prescription</h2>
                
                {/* Chief Complaints */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaints</label>
                  <textarea
                    value={editedData.chief_complaints || ''}
                    onChange={(e) => handleInputChange('chief_complaints', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Patient's main complaints..."
                  />
                </div>

                {/* Clinical Findings */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Clinical Findings</label>
                  <textarea
                    value={editedData.clinical_findings || ''}
                    onChange={(e) => handleInputChange('clinical_findings', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Physical examination findings..."
                  />
                </div>

                {/* Diagnosis */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                  <textarea
                    value={editedData.diagnosis || ''}
                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={2}
                    placeholder="Medical diagnosis..."
                  />
                </div>

                {/* Medicines */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Medicines</label>
                    <button
                      onClick={addMedicine}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                    >
                      + Add Medicine
                    </button>
                  </div>
                  
                  {editedData.medicines?.map((medicine: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">Medicine {index + 1}</h4>
                        <button
                          onClick={() => removeMedicine(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Brand name"
                          value={medicine.brand_name || ''}
                          onChange={(e) => handleMedicineChange(index, 'brand_name', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Generic name"
                          value={medicine.generic_name || ''}
                          onChange={(e) => handleMedicineChange(index, 'generic_name', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={medicine.dosage || ''}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Frequency"
                          value={medicine.frequency || ''}
                          onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={medicine.duration || ''}
                          onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Remarks"
                        value={medicine.remarks || ''}
                        onChange={(e) => handleMedicineChange(index, 'remarks', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
                </div>

                {/* Advice */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Advice</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Diet advice"
                      value={editedData.advice?.diet || ''}
                      onChange={(e) => handleAdviceChange('diet', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Exercise advice"
                      value={editedData.advice?.exercise || ''}
                      onChange={(e) => handleAdviceChange('exercise', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Other advice"
                      value={editedData.advice?.other || ''}
                      onChange={(e) => handleAdviceChange('other', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                {/* Follow-up Date */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Date</label>
                  <input
                    type="date"
                    value={editedData.followup_date || ''}
                    onChange={(e) => handleInputChange('followup_date', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    Generate Prescription
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg transition-colors">
                    Save Draft
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
