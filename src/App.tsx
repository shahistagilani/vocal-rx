import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Square } from 'lucide-react'
import { useState, useRef } from 'react'

function App() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
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

  const uploadAudio = async (audioBlob: Blob) => {
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
    } catch (error) {
      console.error('Error uploading audio:', error)
      setIsProcessing(false)
      alert('Error processing audio. Please try again.')
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
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Transcript</h2>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your transcript will appear here..."
              className="min-h-[300px] text-base leading-relaxed resize-none"
            />
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
