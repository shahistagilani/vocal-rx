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

        // Create a function to draw the waveform bars
        const drawWaveform = () => {
          if (!analyserRef.current || !canvasRef.current) return

          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          analyser.getByteFrequencyData(dataArray)
          
          const width = canvas.width / window.devicePixelRatio
          const height = canvas.height / window.devicePixelRatio
          
          // Clear canvas with transparent background
          ctx.clearRect(0, 0, width, height)
          
          // Draw vertical bars
          const barCount = 60 // Number of bars to display (increased for more density)
          const barWidth = 2
          const barSpacing = 1 // Reduced spacing for closer bars
          
          ctx.fillStyle = '#ffffff'
          
          for (let i = 0; i < barCount; i++) {
            // Sample data points across the frequency spectrum
            const dataIndex = Math.floor((i / barCount) * bufferLength)
            let barHeight = (dataArray[dataIndex] / 255) * height * 0.8
            
            // Ensure minimum bar height for visibility
            barHeight = Math.max(barHeight, 2)
            
            const x = i * (barWidth + barSpacing)
            const y = height - barHeight
            
            // Create rounded rectangle bars (with fallback for browser compatibility)
            if (ctx.roundRect) {
              ctx.beginPath()
              ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2)
              ctx.fill()
            } else {
              // Fallback for browsers that don't support roundRect
              ctx.fillRect(x, y, barWidth, barHeight)
            }
          }

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
        className={`w-full rounded-lg transition-opacity duration-300 ${
          isRecording ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ height: '80px', background: 'transparent' }}
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
