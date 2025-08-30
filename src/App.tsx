import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Mic, Square, FileText } from 'lucide-react'
import { useState, useRef } from 'react'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [prescriptionData, setPrescriptionData] = useState<any>(null)
  const [isExtracting, setIsExtracting] = useState(false)
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
      
      setTranscript(dummyTranscript)
      setIsProcessing(false)
      
      // Extract prescription data
      await extractPrescriptionData(dummyTranscript)
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
    } catch (error) {
      console.error('Error extracting prescription:', error)
      alert('Error extracting prescription data. Please try again.')
    } finally {
      setIsExtracting(false)
    }
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
            
            {/* Extract Button */}
            <Button
              onClick={() => extractPrescriptionData(transcript)}
              disabled={isExtracting}
              className="mb-6"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExtracting ? 'Extracting...' : 'Extract Prescription'}
            </Button>
          </div>
        </section>
      )}

      {/* Prescription Data Display */}
      {prescriptionData && (
        <section className="container mx-auto px-6 pb-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">Structured Prescription</h2>
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
              {/* Chief Complaints */}
              {prescriptionData.chief_complaints && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Chief Complaints</h3>
                  <p className="text-slate-600">{prescriptionData.chief_complaints}</p>
                </div>
              )}

              {/* Clinical Findings */}
              {prescriptionData.clinical_findings && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Clinical Findings</h3>
                  <p className="text-slate-600">{prescriptionData.clinical_findings}</p>
                </div>
              )}

              {/* Diagnosis */}
              {prescriptionData.diagnosis && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Diagnosis</h3>
                  <p className="text-slate-600">{prescriptionData.diagnosis}</p>
                </div>
              )}

              {/* Investigations */}
              {prescriptionData.prescribed_investigations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Prescribed Investigations</h3>
                  <ul className="list-disc list-inside text-slate-600 space-y-1">
                    {prescriptionData.prescribed_investigations.map((test: string, index: number) => (
                      <li key={index}>{test}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medicines */}
              {prescriptionData.medicines.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Medicines</h3>
                  <div className="space-y-3">
                    {prescriptionData.medicines.map((medicine: any, index: number) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Generic Name:</span>
                            <span className="ml-2 text-slate-600">{medicine.generic_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Brand Name:</span>
                            <span className="ml-2 text-slate-600">{medicine.brand_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Dosage:</span>
                            <span className="ml-2 text-slate-600">{medicine.dosage || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Frequency:</span>
                            <span className="ml-2 text-slate-600">{medicine.frequency || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Route:</span>
                            <span className="ml-2 text-slate-600">{medicine.route || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Duration:</span>
                            <span className="ml-2 text-slate-600">{medicine.duration || 'N/A'}</span>
                          </div>
                        </div>
                        {medicine.remarks && (
                          <div className="mt-2">
                            <span className="font-medium text-slate-700">Remarks:</span>
                            <span className="ml-2 text-slate-600">{medicine.remarks}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advice */}
              {(prescriptionData.advice.diet || prescriptionData.advice.exercise || prescriptionData.advice.sleep || prescriptionData.advice.other) && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Advice</h3>
                  <div className="space-y-2 text-slate-600">
                    {prescriptionData.advice.diet && <p><span className="font-medium">Diet:</span> {prescriptionData.advice.diet}</p>}
                    {prescriptionData.advice.exercise && <p><span className="font-medium">Exercise:</span> {prescriptionData.advice.exercise}</p>}
                    {prescriptionData.advice.sleep && <p><span className="font-medium">Sleep:</span> {prescriptionData.advice.sleep}</p>}
                    {prescriptionData.advice.other && <p><span className="font-medium">Other:</span> {prescriptionData.advice.other}</p>}
                  </div>
                </div>
              )}

              {/* Follow-up Date */}
              {prescriptionData.followup_date && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">Follow-up Date</h3>
                  <p className="text-slate-600">{prescriptionData.followup_date}</p>
                </div>
              )}
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
