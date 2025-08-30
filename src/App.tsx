import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Mic, Square, FileText, X, UserCheck, Plus, Minus } from 'lucide-react'
import { useState, useRef } from 'react'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState<any>(null)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasExtracted, setHasExtracted] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await uploadAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  const uploadAudio = async (_audioBlob: Blob) => {
    try {
      // Simulate server upload and processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Part 4: Doctor's unique contribution per visit (voice captured)
      const dummyTranscript = `Chest pain and shortness of breath for the past 2 days

Patient reports substernal chest pain, worse with exertion, associated with mild shortness of breath. No radiation to arms or jaw. No nausea or diaphoresis.

Mild chest discomfort on exertion, no resting pain. Heart sounds normal, no murmurs. Lungs clear bilaterally.

Possible stable angina, rule out myocardial infarction

1. Aspirin 75mg - Once daily - 30 days
2. Atorvastatin 20mg - Once daily at bedtime - 30 days  
3. Metoprolol 25mg - Twice daily - 30 days

Low salt, low fat diet, avoid fried foods, increase omega-3 rich foods
Light walking 30 minutes daily, avoid strenuous activity until follow-up
7-8 hours adequate sleep, elevate head if experiencing chest discomfort

${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')} or sooner if symptoms worsen`
      
      setTranscript(prev => prev ? prev + '\n\n' + dummyTranscript : dummyTranscript)
      setShowTranscript(true)
      setIsProcessing(false)
    } catch (error) {
      console.error('Error uploading audio:', error)
      setIsProcessing(false)
      alert('Error processing audio. Please try again.')
    }
  }

  const extractPrescriptionData = async (transcriptText: string) => {
    try {
      setIsExtracting(true)
      
      const response = await fetch('/api/extract-prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcriptText }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract prescription data')
      }

          const data = await response.json()
    setPrescriptionData(data)
    setEditedData(data) // Initialize edited data with extracted data
    setHasExtracted(true)
    } catch (error) {
      console.error('Error extracting prescription:', error)
      alert('Error extracting prescription data. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  const clearTranscript = () => {
    setTranscript('')
  }

  const handleFieldChange = (field: string, value: any) => {
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

  const handleAdviceChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      advice: {
        ...prev.advice,
        [field]: value
      }
    }))
  }

  const addMedicine = () => {
    setEditedData((prev: any) => ({
      ...prev,
      medicines: [...(prev.medicines || []), {
        brand_name: '',
        generic_name: '',
        dosage: '',
        frequency: '',
        duration: ''
      }]
    }))
  }

  const removeMedicine = (index: number) => {
    setEditedData((prev: any) => ({
      ...prev,
      medicines: prev.medicines.filter((_: any, i: number) => i !== index)
    }))
  }

  const addAdviceItem = (category: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      advice: {
        ...prev.advice,
        [category]: [...(prev.advice?.[category] || ['']), '']
      }
    }))
  }

  const removeAdviceItem = (category: string, index: number) => {
    setEditedData((prev: any) => ({
      ...prev,
      advice: {
        ...prev.advice,
        [category]: prev.advice?.[category]?.filter((_: string, i: number) => i !== index) || []
      }
    }))
  }

  const handleAdviceItemChange = (category: string, index: number, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      advice: {
        ...prev.advice,
        [category]: prev.advice?.[category]?.map((item: string, i: number) => 
          i === index ? value : item
        ) || [value]
      }
    }))
  }

  const handleInvestigationChange = (index: number, value: string) => {
    setEditedData((prev: any) => ({
      ...prev,
      prescribed_investigations: prev.prescribed_investigations.map((inv: string, i: number) => 
        i === index ? value : inv
      )
    }))
  }

  const handleApprovePrescription = () => {
    // TODO: Implement doctor approval and e-signature
    alert('Prescription approved and signed! This would integrate with e-signature service.')
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-orange-50 via-rose-50 to-amber-50 text-slate-900 relative overflow-hidden">
      <section className="container mx-auto px-6 pt-20 pb-40 text-center">
        <h1 className="mx-auto max-w-5xl font-light text-7xl sm:text-8xl md:text-9xl tracking-wide leading-none text-slate-800">
          Vocal RX
        </h1>
        <p className="mx-auto mt-10 max-w-4xl text-2xl sm:text-3xl md:text-4xl font-light leading-relaxed text-slate-600">
          Healing begins with a conversation, 
          turning <span className="text-indigo-500 font-normal">voices</span> into <span className="text-emerald-600 font-normal">care</span>.
        </p>
        <p className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-slate-500 font-light">
          Dictate a prescription. We structure it instantly. Edit and export in seconds.
        </p>
      </section>

      {/* Transcript Display */}
      {showTranscript && (
        <section className="container mx-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-800">Transcript</h2>
              {isExtracting && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <div className="h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Extracting prescription data...
                </div>
              )}
            </div>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your transcript will appear here..."
              className="min-h-[300px] text-base leading-relaxed resize-none mb-6"
            />
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 mb-6">
              <Button
                onClick={() => extractPrescriptionData(transcript)}
                disabled={isExtracting || !transcript.trim()}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isExtracting ? 'Extracting...' : 'Extract Prescription'}
              </Button>
              <Button
                onClick={clearTranscript}
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Prescription Data Display */}
      {prescriptionData && hasExtracted && (
        <section className="container mx-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">Structured Prescription</h2>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Clinic Header */}
              <div className="border-b pb-4 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">🏥</span>
                  </div>
                  <div className="text-xl font-bold text-center mb-2 text-slate-800">
                    {staticData.clinic_name}
                  </div>
                  <div className="text-sm text-center text-slate-600">
                    {staticData.clinic_tagline}
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Doctor Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-slate-700">Name:</span>
                      <span className="ml-2 text-slate-800">{staticData.doctor_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Qualification:</span>
                      <span className="ml-2 text-slate-800">{staticData.doctor_qualification}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Registration No:</span>
                      <span className="ml-2 text-slate-800">{staticData.doctor_reg_no}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-3">Clinic Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-slate-700">Address:</span>
                      <span className="ml-2 text-slate-800">{staticData.clinic_address}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Timings:</span>
                      <span className="ml-2 text-slate-800">{staticData.clinic_timings}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Phone:</span>
                      <span className="ml-2 text-slate-800">{staticData.clinic_phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Patient Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-slate-700">Patient ID:</span>
                      <span className="ml-2 text-slate-800">{staticData.patient_id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Name:</span>
                      <span className="ml-2 text-slate-800">{staticData.patient_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-slate-700">Age:</span>
                        <span className="ml-2 text-slate-800">{staticData.patient_age}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Gender:</span>
                        <span className="ml-2 text-slate-800">{staticData.patient_gender}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-slate-700">Phone:</span>
                      <span className="ml-2 text-slate-800">{staticData.patient_phone}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Date:</span>
                      <span className="ml-2 text-slate-800">{staticData.prescription_date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vitals */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Vitals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="font-medium text-slate-700">Temperature:</span>
                    <span className="ml-2 text-slate-800">{staticData.vitals_temp}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Blood Pressure:</span>
                    <span className="ml-2 text-slate-800">{staticData.vitals_bp}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Height:</span>
                    <span className="ml-2 text-slate-800">{staticData.vitals_height}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Weight:</span>
                    <span className="ml-2 text-slate-800">{staticData.vitals_weight}</span>
                  </div>
                </div>
              </div>
              {/* Chief Complaints */}
              {prescriptionData.chief_complaints && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Chief Complaints</h3>
                  <Textarea
                    value={editedData?.chief_complaints || prescriptionData.chief_complaints}
                    onChange={(e) => handleFieldChange('chief_complaints', e.target.value)}
                    placeholder="Enter chief complaints..."
                    className="w-full min-h-[80px] border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors resize-none"
                  />
                </div>
              )}

              {/* Clinical Findings */}
              {prescriptionData.clinical_findings && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Clinical Findings</h3>
                  <Input
                    value={editedData?.clinical_findings || prescriptionData.clinical_findings}
                    onChange={(e) => handleFieldChange('clinical_findings', e.target.value)}
                    placeholder="Enter clinical findings..."
                    className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              )}

              {/* Diagnosis */}
              {prescriptionData.diagnosis && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Diagnosis</h3>
                  <Textarea
                    value={editedData?.diagnosis || prescriptionData.diagnosis}
                    onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                    placeholder="Enter diagnosis..."
                    className="w-full min-h-[80px] border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors resize-none"
                  />
                </div>
              )}

              {/* Investigations */}
              {prescriptionData.prescribed_investigations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Prescribed Investigations</h3>
                  <div className="space-y-2">
                    {(editedData?.prescribed_investigations || prescriptionData.prescribed_investigations).map((test: string, index: number) => (
                      <Input
                        key={index}
                        value={test}
                        onChange={(e) => handleInvestigationChange(index, e.target.value)}
                        placeholder={`Investigation ${index + 1}`}
                        className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                      />
                    ))}
                  </div>
                </div>
              )}


              {/* Rx Medicines - Tabular Format */}
              {(prescriptionData.medicines && prescriptionData.medicines.length > 0) || (editedData?.medicines && editedData.medicines.length > 0) ? (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Rx Medicine</h3>
                    <Button
                      onClick={addMedicine}
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Medicine
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border border-slate-300 px-3 py-2 text-left font-medium text-slate-700">Medicine Name (Generic Name)</th>
                          <th className="border border-slate-300 px-3 py-2 text-left font-medium text-slate-700">Dosage</th>
                          <th className="border border-slate-300 px-3 py-2 text-left font-medium text-slate-700">Duration</th>
                          <th className="border border-slate-300 px-3 py-2 text-center font-medium text-slate-700 w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editedData?.medicines || prescriptionData.medicines || []).map((medicine: any, index: number) => (
                          <tr key={index}>
                            <td className="border border-slate-300 px-3 py-2">
                              <Input
                                value={`${medicine.brand_name || medicine.generic_name || ''} ${medicine.generic_name && medicine.brand_name ? `(${medicine.generic_name})` : ''}`}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const match = value.match(/^(.+?)\s*\((.+?)\)\s*$/);
                                  if (match) {
                                    handleMedicineChange(index, 'brand_name', match[1].trim());
                                    handleMedicineChange(index, 'generic_name', match[2].trim());
                                  } else {
                                    handleMedicineChange(index, 'brand_name', value);
                                  }
                                }}
                                placeholder="Medicine Name (Generic Name)"
                                className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <Input
                                value={`${medicine.dosage || ''} ${medicine.frequency || ''}`}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const parts = value.split(' ');
                                  if (parts.length >= 2) {
                                    handleMedicineChange(index, 'dosage', parts[0]);
                                    handleMedicineChange(index, 'frequency', parts.slice(1).join(' '));
                                  } else {
                                    handleMedicineChange(index, 'dosage', value);
                                  }
                                }}
                                placeholder="25mg twice daily"
                                className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2">
                              <Input
                                value={medicine.duration || ''}
                                onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                placeholder="30 days"
                                className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                              />
                            </td>
                            <td className="border border-slate-300 px-3 py-2 text-center">
                              <Button
                                onClick={() => removeMedicine(index)}
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-700">Rx Medicine</h3>
                    <Button
                      onClick={addMedicine}
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Medicine
                    </Button>
                  </div>
                  <p className="text-slate-500 text-sm">No medicines prescribed yet. Click "Add Medicine" to start.</p>
                </div>
              )}

              {/* Advice */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-3">Advice</h3>
                <div className="space-y-4">
                  {/* Diet Advice */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-700">Diet:</span>
                      <Button
                        onClick={() => addAdviceItem('diet')}
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(editedData?.advice?.diet) ? 
                        editedData.advice.diet.map((item: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => handleAdviceItemChange('diet', index, e.target.value)}
                              placeholder="Diet recommendation"
                              className="flex-1 border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                            <Button
                              onClick={() => removeAdviceItem('diet', index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        )) : (
                          <Input
                            value={editedData?.advice?.diet ?? prescriptionData?.advice?.diet ?? ''}
                            onChange={(e) => handleAdviceChange('diet', e.target.value)}
                            placeholder="Low salt, low fat diet recommendations"
                            className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                          />
                        )
                      }
                    </div>
                  </div>

                  {/* Exercise Advice */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-700">Exercise:</span>
                      <Button
                        onClick={() => addAdviceItem('exercise')}
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(editedData?.advice?.exercise) ? 
                        editedData.advice.exercise.map((item: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => handleAdviceItemChange('exercise', index, e.target.value)}
                              placeholder="Exercise recommendation"
                              className="flex-1 border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                            <Button
                              onClick={() => removeAdviceItem('exercise', index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        )) : (
                          <Input
                            value={editedData?.advice?.exercise ?? prescriptionData?.advice?.exercise ?? ''}
                            onChange={(e) => handleAdviceChange('exercise', e.target.value)}
                            placeholder="Exercise recommendations"
                            className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                          />
                        )
                      }
                    </div>
                  </div>

                  {/* Sleep Advice */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-700">Sleep:</span>
                      <Button
                        onClick={() => addAdviceItem('sleep')}
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 p-1 h-6 w-6"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {Array.isArray(editedData?.advice?.sleep) ? 
                        editedData.advice.sleep.map((item: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => handleAdviceItemChange('sleep', index, e.target.value)}
                              placeholder="Sleep recommendation"
                              className="flex-1 border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                            <Button
                              onClick={() => removeAdviceItem('sleep', index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-6 w-6"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        )) : (
                          <Input
                            value={editedData?.advice?.sleep ?? prescriptionData?.advice?.sleep ?? ''}
                            onChange={(e) => handleAdviceChange('sleep', e.target.value)}
                            placeholder="Sleep recommendations"
                            className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                          />
                        )
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Follow-up Date */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Follow-up Date</h3>
                <Input
                  value={editedData?.followup_date || prescriptionData.followup_date || ''}
                  onChange={(e) => handleFieldChange('followup_date', e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                />
              </div>

              {/* Doctor Approval Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Doctor Approval</h3>
                    <p className="text-sm text-slate-500">Review and approve the prescription</p>
                  </div>
                  <Button
                    onClick={handleApprovePrescription}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center gap-2"
                  >
                    <UserCheck className="h-5 w-5" />
                    Approve & Sign
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={isRecording ? "Stop recording" : "Start dictation"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              className={`fixed left-1/2 -translate-x-1/2 bottom-10 h-16 w-16 rounded-full shadow-lg focus-visible:ring-4 transition-all duration-200 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 animate-pulse' 
                  : isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-300'
              } text-white`}
              variant="default"
            >
              {isProcessing ? (
                <div className="h-7 w-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isRecording ? (
                <Square className="h-7 w-7" />
              ) : (
                <Mic className="h-7 w-7" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isProcessing ? "Processing..." : isRecording ? "Stop recording" : "Start dictating"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </main>
  )
}

export default App
