import { useState, useRef } from 'react'
import { RecordingInterface } from './RecordingInterface'
import { useTimer } from '../hooks/useTimer'
import PatientInfoSidebar from './PatientInfoSidebar'

interface RecordingPageProps {
  onBackToHome: () => void
}

export default function RecordingPage({ onBackToHome }: RecordingPageProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasExtracted, setHasExtracted] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const { time, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer()

  // Mock patient data
  const mockPatientData = {
    id: 'PAT-2024-001',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    phone: '+1-555-0123',
    photo: '/api/placeholder/patient-photo',
    conditions: ['Hypertension', 'Type 2 Diabetes'],
    vitals: {
      bloodPressure: '140/90 mmHg',
      temperature: '98.6°F',
      weight: '180 lbs',
      height: '5\'10"',
      heartRate: '72 bpm',
      lastUpdated: '2024-12-06'
    },
    labResults: [
      { test: 'HbA1c', result: '7.2%', date: '2024-12-01', status: 'abnormal' as const },
      { test: 'Fasting Glucose', result: '145 mg/dL', date: '2024-12-01', status: 'abnormal' as const },
      { test: 'Total Cholesterol', result: '195 mg/dL', date: '2024-12-01', status: 'normal' as const },
      { test: 'HDL', result: '45 mg/dL', date: '2024-12-01', status: 'normal' as const },
      { test: 'LDL', result: '120 mg/dL', date: '2024-12-01', status: 'normal' as const }
    ]
  }

  // Mock doctor and clinic data
  const mockDoctorData = {
    name: 'Dr. Sarah Johnson',
    qualification: 'MBBS, MD (Internal Medicine)',
    registrationNumber: 'MCI-12345-2018',
    signature: 'Dr. Sarah Johnson'
  }

  const mockClinicData = {
    name: 'HealthCare Plus Clinic',
    address: '123 Medical Center Drive, Suite 200, Healthcare City, HC 12345',
    phone: '+1-555-HEALTH (432584)',
    timings: 'Mon-Fri: 9:00 AM - 6:00 PM, Sat: 9:00 AM - 2:00 PM',
    closedOn: 'Sundays and Public Holidays'
  }

  // Get today's date
  const getTodaysDate = () => {
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
        body: JSON.stringify({ 
          transcript,
          patientInfo: mockPatientData
        }),
      })

      if (!response.ok) {
        throw new Error('Prescription extraction failed')
      }

      const extractedData = await response.json()
      // Include patient information as read-only data
      const prescriptionWithPatient = {
        ...extractedData,
        patient: {
          id: mockPatientData.id,
          name: mockPatientData.name,
          age: mockPatientData.age,
          gender: mockPatientData.gender,
          conditions: mockPatientData.conditions
        },
      }
      setEditedData(prescriptionWithPatient)
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
        ...(prev.medicines || []),
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

  const generatePrescription = () => {
    // Create comprehensive prescription template
    const prescriptionTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Medical Prescription</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { width: 60px; height: 60px; margin: 0 auto 10px; background: #2c5aa0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; }
        .tagline { font-size: 14px; color: #666; margin-bottom: 15px; font-style: italic; }
        .header-content { display: flex; justify-content: space-between; text-align: left; margin-top: 15px; }
        .doctor-section { flex: 1; padding-right: 20px; }
        .clinic-section { flex: 1; padding-left: 20px; }
        .doctor-name { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 5px; }
        .doctor-qualification { font-size: 14px; color: #666; margin-bottom: 5px; }
        .doctor-registration { font-size: 12px; color: #666; margin-bottom: 15px; }
        .clinic-name { font-size: 18px; font-weight: bold; color: #2c5aa0; margin-bottom: 5px; }
        .clinic-address { font-size: 12px; color: #666; margin-bottom: 3px; }
        .clinic-timings { font-size: 12px; color: #666; margin-bottom: 3px; }
        .clinic-phone { font-size: 12px; color: #666; }
        .patient-info { display: flex; justify-content: space-between; margin: 20px 0; padding: 10px 0; border-bottom: 1px solid #ddd; }
        .patient-left { flex: 1; }
        .patient-right { flex: 1; text-align: right; }
        .info-line { margin-bottom: 5px; }
        .section { margin: 15px 0; }
        .section-title { font-weight: bold; margin-bottom: 5px; text-decoration: underline; }
        .vitals { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; }
        .vital-item { padding: 8px; background: white; border-radius: 5px; border: 1px solid #dee2e6; }
        .medicine-item { margin-bottom: 8px; }
        .medicine-line { font-weight: bold; }
        .medicine-dosage { margin-left: 20px; }
        .signature { margin-top: 60px; text-align: right; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin-left: auto; padding-top: 10px; text-align: center; }
        .handwritten-signature { font-family: 'Brush Script MT', cursive, 'Dancing Script', serif; font-size: 24px; color: #2c5aa0; font-weight: bold; transform: rotate(-2deg); margin-bottom: 5px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">HC</div>
        <div class="tagline">Healing begins with a conversation. Turning voices into care.</div>
        <div class="header-content">
            <div class="doctor-section">
                <div class="doctor-name">${mockDoctorData.name}</div>
                <div class="doctor-qualification">${mockDoctorData.qualification}</div>
                <div class="doctor-registration">Medical Registration Number: ${mockDoctorData.registrationNumber}</div>
            </div>
            <div class="clinic-section">
                <div class="clinic-name">${mockClinicData.name}</div>
                <div class="clinic-address">${mockClinicData.address}</div>
                <div class="clinic-timings">Timings: ${mockClinicData.timings}</div>
                <div class="clinic-timings">Closed on: ${mockClinicData.closedOn}</div>
                <div class="clinic-phone">Phone Numbers: ${mockClinicData.phone}</div>
            </div>
        </div>
    </div>

    <div class="patient-info">
        <div class="patient-left">
            <div class="info-line"><strong>Patient ID:</strong> ${editedData.patient?.id || mockPatientData.id}</div>
            <div class="info-line"><strong>Patient Name:</strong> ${editedData.patient?.name || mockPatientData.name}</div>
            <div class="info-line"><strong>Age & ${editedData.patient?.gender || mockPatientData.gender} Indicator:</strong> ${editedData.patient?.age || mockPatientData.age} years, ${editedData.patient?.gender || mockPatientData.gender}</div>
            <div class="info-line"><strong>Phone Number:</strong> ${mockPatientData.phone}</div>
        </div>
        <div class="patient-right">
            <div class="info-line"><strong>Date of Prescription:</strong> ${getTodaysDate()}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Vitals:</div>
        <div class="vitals">
            <div class="vital-item"><strong>Body Temperature:</strong> ${mockPatientData.vitals.temperature}</div>
            <div class="vital-item"><strong>Blood Pressure:</strong> ${mockPatientData.vitals.bloodPressure}</div>
            <div class="vital-item"><strong>Height:</strong> ${mockPatientData.vitals.height}</div>
            <div class="vital-item"><strong>Weight:</strong> ${mockPatientData.vitals.weight}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Chief Complaints:</div>
        <div>${editedData.chief_complaints || ''}</div>
    </div>

    <div class="section">
        <div class="section-title">Notes:</div>
        <div>${editedData.notes || ''}</div>
    </div>

    <div class="section">
        <div class="section-title">Clinical Findings:</div>
        <div>${editedData.clinical_findings || ''}</div>
    </div>

    <div class="section">
        <div class="section-title">Prescribed Investigation:</div>
        <div>
            ${editedData.prescribed_investigations?.length > 0 
                ? editedData.prescribed_investigations.map((test: string) => `• ${test}`).join('<br>')
                : ''
            }
        </div>
    </div>

    <div class="section">
        <div class="section-title">Diagnosis:</div>
        <div>${editedData.diagnosis || ''}</div>
    </div>

    <div class="section">
        <div class="section-title">Rx Medicine:</div>
        ${editedData.medicines?.length > 0 
            ? editedData.medicines.map((med: any, index: number) => `
                <div class="medicine-item">
                    <div class="medicine-line">${index + 1}. ${med.brand_name || 'Medicine Name'}${med.generic_name ? ` (${med.generic_name})` : ''}</div>
                    <div class="medicine-dosage">${med.dosage || '_____'} | ${med.duration || '_____'}</div>
                    ${med.remarks ? `<div class="medicine-dosage" style="font-style: italic;">Note: ${med.remarks}</div>` : ''}
                </div>
            `).join('')
            : '<div class="medicine-item">No medicines prescribed</div>'
        }
    </div>

    <div class="section">
        <div class="section-title">Advice:</div>
        <div>
            ${editedData.advice?.diet ? `<div><strong>Diet:</strong> ${editedData.advice.diet}</div>` : ''}
            ${editedData.advice?.exercise ? `<div><strong>Exercise:</strong> ${editedData.advice.exercise}</div>` : ''}
            ${editedData.advice?.sleep ? `<div><strong>Sleep:</strong> ${editedData.advice.sleep}</div>` : ''}
            ${editedData.advice?.other ? `<div><strong>Other:</strong> ${editedData.advice.other}</div>` : ''}
            ${!editedData.advice?.diet && !editedData.advice?.exercise && !editedData.advice?.sleep && !editedData.advice?.other ? 'No specific advice given' : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Follow-up Date:</div>
        <div>${editedData.followup_date || 'As needed'}</div>
    </div>

    <div class="signature">
        <div class="signature-line">
            <div class="handwritten-signature">Dr. ${mockDoctorData.name.split(' ')[1] || mockDoctorData.name}</div>
            <small>Doctor's Signature</small>
        </div>
    </div>
</body>
</html>
    `

    // Open prescription in new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(prescriptionTemplate)
      printWindow.document.close()
      printWindow.focus()
      // Auto print after a short delay
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Patient Information */}
          <div className="lg:col-span-1">
            <PatientInfoSidebar patientData={mockPatientData} />
          </div>

          {/* Right Column - Recording Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recording Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hello Doctor!</h2>
              
              {!isRecording && !isProcessing && !showTranscript && (
                <button
                  onClick={startRecording}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start Recording the Prescription
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
                  <p className="text-gray-600">Processing your recording...</p>
                </div>
              )}
            </div>

            {/* Transcript Display */}
            {showTranscript && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Transcript</h3>
                  <button
                    onClick={() => setShowTranscript(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Your prescription transcript will appear here and can be edited..."
                  />
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={extractPrescription}
                    disabled={isExtracting}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isExtracting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Extracting...
                      </>
                    ) : (
                      'Extract Prescription'
                    )}
                  </button>
                  <button
                    onClick={restartRecording}
                    className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Record Again
                  </button>
                </div>
              </div>
            )}

            {/* Prescription Data */}
            {hasExtracted && editedData && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Prescription Data</h3>

                {/* Patient Information - Read Only */}
                {editedData.patient && (
                  <div className="mb-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Patient Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Name:</span> {editedData.patient.name}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">ID:</span> {editedData.patient.id}
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Age:</span> {editedData.patient.age} years
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Gender:</span> {editedData.patient.gender}
                      </div>
                    </div>
                    {editedData.patient.conditions && editedData.patient.conditions.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-600">Known Conditions:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {editedData.patient.conditions.map((condition: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              {condition}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={editedData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    rows={3}
                    placeholder="Additional notes..."
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

                {/* Prescribed Investigations */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prescribed Investigations</label>
                  <div className="space-y-2">
                    {editedData.prescribed_investigations?.map((investigation: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={investigation}
                          onChange={(e) => {
                            const newInvestigations = [...(editedData.prescribed_investigations || [])]
                            newInvestigations[index] = e.target.value
                            handleInputChange('prescribed_investigations', newInvestigations)
                          }}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          placeholder="Investigation name (e.g., CBC, Chest X-ray)"
                        />
                        <button
                          onClick={() => {
                            const newInvestigations = editedData.prescribed_investigations?.filter((_: any, i: number) => i !== index) || []
                            handleInputChange('prescribed_investigations', newInvestigations)
                          }}
                          className="text-red-500 hover:text-red-700 text-sm px-2"
                        >
                          Remove
                        </button>
                      </div>
                    )) || []}
                    <button
                      onClick={() => {
                        const newInvestigations = [...(editedData.prescribed_investigations || []), '']
                        handleInputChange('prescribed_investigations', newInvestigations)
                      }}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm"
                    >
                      + Add Investigation
                    </button>
                  </div>
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
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Medicine name"
                          value={medicine.brand_name || ''}
                          onChange={(e) => handleMedicineChange(index, 'brand_name', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Dosage"
                          value={medicine.dosage || ''}
                          onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Duration"
                            value={medicine.duration || ''}
                            onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => removeMedicine(index)}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title="Delete medicine"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
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
                      placeholder="Sleep advice"
                      value={editedData.advice?.sleep || ''}
                      onChange={(e) => handleAdviceChange('sleep', e.target.value)}
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
                  <button 
                    onClick={generatePrescription}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    E-Sign & Approve
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
