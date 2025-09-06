import { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY
    if (!DEEPGRAM_API_KEY) {
      return res.status(500).json({ error: 'Deepgram API key not configured' })
    }

    // Get the audio data from the request
    const audioBuffer = Buffer.from(req.body)

    // Call Deepgram API
    const deepgramResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&language=multi&smart_format=true&dictation=true&paragraphs=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
        body: audioBuffer,
      }
    )

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text()
      console.error('Deepgram API error:', errorText)
      return res.status(500).json({ error: 'Transcription failed' })
    }

    const deepgramData = await deepgramResponse.json()
    
    // Extract transcript from Deepgram response
    const transcript = deepgramData.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    
    if (!transcript) {
      return res.status(400).json({ error: 'No transcript generated' })
    }

    return res.status(200).json({ transcript })

  } catch (error) {
    console.error('Transcription error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
