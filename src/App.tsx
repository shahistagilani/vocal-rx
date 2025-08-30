import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Mic, Square, FileText, X, UserCheck } from 'lucide-react'
import { useState, useRef } from 'react'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState<any>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [hasExtracted, setHasExtracted] = useState(false)
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
      
      // Dummy transcript for now
      const dummyTranscript = `Patient: John Doe, 45 years old, male
Chief Complaint: Chest pain and shortness of breath
History: Patient reports chest pain for the past 2 days, worse with exertion
Physical Exam: BP 140/90, HR 88, RR 18, Temp 98.6
Assessment: Possible angina, rule out MI
Plan: 
- ECG and cardiac enzymes
- Aspirin 325mg daily
- Nitroglycerin PRN for chest pain
- Follow up in 1 week`
      
      setTranscript(prev => prev ? prev + '\n\n' + dummyTranscript : dummyTranscript)
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
      {transcript && (
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
                disabled={isExtracting}
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
              <p className="text-sm text-slate-500">Click any field to edit</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Chief Complaints */}
              {prescriptionData.chief_complaints && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Chief Complaints</h3>
                  <Input
                    value={editedData?.chief_complaints || prescriptionData.chief_complaints}
                    onChange={(e) => handleFieldChange('chief_complaints', e.target.value)}
                    placeholder="Enter chief complaints..."
                    className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
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
                  <Input
                    value={editedData?.diagnosis || prescriptionData.diagnosis}
                    onChange={(e) => handleFieldChange('diagnosis', e.target.value)}
                    placeholder="Enter diagnosis..."
                    className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
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

              {/* Medicines */}
              {prescriptionData.medicines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Medicines</h3>
                  <div className="space-y-3">
                    {(editedData?.medicines || prescriptionData.medicines).map((medicine: any, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Generic Name:</span>
                            <Input
                              value={medicine.generic_name || ''}
                              onChange={(e) => handleMedicineChange(index, 'generic_name', e.target.value)}
                              placeholder="Generic name"
                              className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Brand Name:</span>
                            <Input
                              value={medicine.brand_name || ''}
                              onChange={(e) => handleMedicineChange(index, 'brand_name', e.target.value)}
                              placeholder="Brand name"
                              className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Dosage:</span>
                            <Input
                              value={medicine.dosage || ''}
                              onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                              placeholder="Dosage"
                              className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Frequency:</span>
                            <Input
                              value={medicine.frequency || ''}
                              onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                              placeholder="Frequency"
                              className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Route:</span>
                            <Input
                              value={medicine.route || ''}
                              onChange={(e) => handleMedicineChange(index, 'route', e.target.value)}
                              placeholder="Route"
                              className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Duration:</span>
                            <Input
                              value={medicine.duration || ''}
                              onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                              placeholder="Duration"
                              className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium text-slate-700">Remarks:</span>
                          <Input
                            value={medicine.remarks || ''}
                            onChange={(e) => handleMedicineChange(index, 'remarks', e.target.value)}
                            placeholder="Remarks"
                            className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              {(prescriptionData.advice?.diet || prescriptionData.advice?.exercise || prescriptionData.advice?.sleep || prescriptionData.advice?.other) && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Advice</h3>
                  <div className="space-y-3">
                    {(prescriptionData.advice?.diet || editedData?.advice?.diet !== undefined) && (
                      <div>
                        <span className="font-medium text-slate-700">Diet:</span>
                        <Input
                          value={editedData?.advice?.diet ?? prescriptionData.advice?.diet ?? ''}
                          onChange={(e) => handleAdviceChange('diet', e.target.value)}
                          placeholder="Diet advice"
                          className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                    {(prescriptionData.advice?.exercise || editedData?.advice?.exercise !== undefined) && (
                      <div>
                        <span className="font-medium text-slate-700">Exercise:</span>
                        <Input
                          value={editedData?.advice?.exercise ?? prescriptionData.advice?.exercise ?? ''}
                          onChange={(e) => handleAdviceChange('exercise', e.target.value)}
                          placeholder="Exercise advice"
                          className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                    {(prescriptionData.advice?.sleep || editedData?.advice?.sleep !== undefined) && (
                      <div>
                        <span className="font-medium text-slate-700">Sleep:</span>
                        <Input
                          value={editedData?.advice?.sleep ?? prescriptionData.advice?.sleep ?? ''}
                          onChange={(e) => handleAdviceChange('sleep', e.target.value)}
                          placeholder="Sleep advice"
                          className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                    {(prescriptionData.advice?.other || editedData?.advice?.other !== undefined) && (
                      <div>
                        <span className="font-medium text-slate-700">Other:</span>
                        <Input
                          value={editedData?.advice?.other ?? prescriptionData.advice?.other ?? ''}
                          onChange={(e) => handleAdviceChange('other', e.target.value)}
                          placeholder="Other advice"
                          className="ml-2 w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Follow-up Date */}
              {prescriptionData.followup_date && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Follow-up Date</h3>
                  <Input
                    value={editedData?.followup_date || prescriptionData.followup_date}
                    onChange={(e) => handleFieldChange('followup_date', e.target.value)}
                    placeholder="YYYY-MM-DD"
                    className="w-full border-transparent hover:border-slate-300 focus:border-slate-400 bg-transparent hover:bg-slate-50 focus:bg-white transition-colors"
                  />
                </div>
              )}

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
