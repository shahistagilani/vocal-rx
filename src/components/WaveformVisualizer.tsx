import { useEffect, useRef } from 'react'

interface WaveformVisualizerProps {
  isRecording: boolean
  mediaStream?: MediaStream | null
}

export const WaveformVisualizer = ({ 
  isRecording, 
  mediaStream
}: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)

  // Setup live audio visualization
  useEffect(() => {
    if (!isRecording || !mediaStream) {
      // Clean up when not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      return
    }

    const setupLiveVisualization = async () => {
      try {
        const canvas = canvasRef.current
        if (!canvas) return

        // Set canvas size
        const rect = canvas.getBoundingClientRect()
        canvas.width = rect.width * window.devicePixelRatio
        canvas.height = rect.height * window.devicePixelRatio
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

        // Create audio context and analyser
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(mediaStream)
        
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.3
        
        source.connect(analyser)
        
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        sourceRef.current = source

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        // Create a function to draw the waveform
        const drawWaveform = () => {
          if (!analyserRef.current || !canvasRef.current) return

          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          analyser.getByteTimeDomainData(dataArray)
          
          const width = canvas.width / window.devicePixelRatio
          const height = canvas.height / window.devicePixelRatio
          
          // Clear canvas
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.fillRect(0, 0, width, height)
          
          // Draw waveform
          ctx.lineWidth = 2
          ctx.strokeStyle = '#f97316'
          ctx.beginPath()
          
          const sliceWidth = width / bufferLength
          let x = 0
          
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0
            const y = (v * height) / 2
            
            if (i === 0) {
              ctx.moveTo(x, y)
            } else {
              ctx.lineTo(x, y)
            }
            
            x += sliceWidth
          }
          
          ctx.stroke()

          if (isRecording) {
            animationRef.current = requestAnimationFrame(drawWaveform)
          }
        }

        drawWaveform()
      } catch (error) {
        console.error('Error setting up live visualization:', error)
      }
    }

    setupLiveVisualization()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
      }
    }
  }, [isRecording, mediaStream])

  return (
    <div className="w-full">
      <canvas 
        ref={canvasRef}
        className={`w-full bg-slate-50 rounded-lg transition-opacity duration-300 ${
          isRecording ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ height: '80px' }}
      />
      {isRecording && (
        <div className="text-center mt-2">
          <span className="inline-flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Recording...
          </span>
        </div>
      )}
    </div>
  )
}
