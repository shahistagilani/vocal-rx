import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface WaveformVisualizerProps {
  isRecording: boolean
  mediaStream?: MediaStream | null
  onVisualizerReady?: (wavesurfer: WaveSurfer) => void
}

export const WaveformVisualizer = ({ 
  isRecording, 
  mediaStream, 
  onVisualizerReady 
}: WaveformVisualizerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || wavesurferRef.current) return

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#f97316', // Orange color matching the theme
      progressColor: '#ea580c',
      cursorColor: '#dc2626',
      barWidth: 3,
      barRadius: 3,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
      mediaControls: false,
    })

    wavesurferRef.current = wavesurfer
    setIsInitialized(true)
    onVisualizerReady?.(wavesurfer)

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy()
        wavesurferRef.current = null
      }
    }
  }, [onVisualizerReady])

  // Setup live audio visualization
  useEffect(() => {
    if (!isRecording || !mediaStream || !isInitialized) {
      // Clean up when not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      analyserRef.current = null
      return
    }

    const setupLiveVisualization = async () => {
      try {
        // Create audio context and analyser
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(mediaStream)
        
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        
        source.connect(analyser)
        
        audioContextRef.current = audioContext
        analyserRef.current = analyser
        sourceRef.current = source

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        // Create a function to draw the waveform
        const drawWaveform = () => {
          if (!analyserRef.current || !wavesurferRef.current) return

          analyser.getByteTimeDomainData(dataArray)
          
          // Create a simple waveform visualization
          // Since WaveSurfer expects audio buffer, we'll simulate it
          const canvas = containerRef.current?.querySelector('canvas')
          if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx) {
              const width = canvas.width
              const height = canvas.height
              
              ctx.clearRect(0, 0, width, height)
              ctx.strokeStyle = '#f97316'
              ctx.lineWidth = 2
              ctx.beginPath()
              
              const sliceWidth = width / bufferLength
              let x = 0
              
              for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0
                const y = v * height / 2
                
                if (i === 0) {
                  ctx.moveTo(x, y)
                } else {
                  ctx.lineTo(x, y)
                }
                
                x += sliceWidth
              }
              
              ctx.stroke()
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
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isRecording, mediaStream, isInitialized])

  return (
    <div className="w-full">
      <div 
        ref={containerRef} 
        className={`w-full transition-opacity duration-300 ${
          isRecording ? 'opacity-100' : 'opacity-50'
        }`}
        style={{ minHeight: '80px' }}
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
