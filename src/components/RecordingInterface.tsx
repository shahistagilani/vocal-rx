import { RotateCcw, X } from 'lucide-react'
import { WaveformVisualizer } from './WaveformVisualizer'
import { useTimer } from '../hooks/useTimer'

interface RecordingInterfaceProps {
  isRecording: boolean
  mediaStream?: MediaStream | null
  onRestart: () => void
  onStop: () => void
}

export const RecordingInterface = ({
  isRecording,
  mediaStream,
  onRestart,
  onStop
}: RecordingInterfaceProps) => {
  const { formattedTime } = useTimer(isRecording)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-orange-500 rounded-3xl p-8 w-full max-w-md text-white text-center relative">
        {/* Timer */}
        <div className="text-4xl font-light mb-4">
          {formattedTime}
        </div>

        {/* Prompt Text */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Ready to dictate?</h3>
          <p className="text-sm opacity-90 leading-relaxed">
            Describe the patient's chief complaints, clinical findings, diagnosis, 
            and treatment plan. Speak naturally - our AI will structure your notes professionally.
          </p>
        </div>

        {/* Waveform Visualizer */}
        <div className="mb-6 h-16">
          <WaveformVisualizer 
            isRecording={isRecording}
            mediaStream={mediaStream}
          />
        </div>

        {/* Output Language */}
        <div className="bg-orange-400/50 rounded-lg p-3 mb-6">
          <div className="flex justify-between items-center text-sm">
            <span className="opacity-80">Output:</span>
            <span className="font-medium">English (US)</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onRestart}
            className="w-12 h-12 rounded-full bg-orange-400/30 hover:bg-orange-400/50 transition-colors flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onStop}
            className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <div className="w-6 h-6 bg-orange-500 rounded-sm" />
          </button>

          <button
            onClick={onStop}
            className="w-12 h-12 rounded-full bg-orange-400/30 hover:bg-orange-400/50 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
