import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Refine transcript API called with method:', req.method)
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    console.log('GEMINI_API_KEY exists:', !!GEMINI_API_KEY)
    
    if (!GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables')
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    console.log('Request body:', JSON.stringify(req.body).substring(0, 200))
    const { transcript } = req.body as { transcript?: string }

    if (!transcript || !transcript.trim()) {
      console.error('No transcript provided in request body')
      return res.status(400).json({ error: 'Transcript is required' })
    }

    console.log('Transcript length:', transcript.length)

    // Prompt to refine and standardize medical content
    const systemInstruction = `
You are a medical scribe assistant. Given a raw dictation transcript from a doctor,
- Correct grammar, spelling, and punctuation.
- Normalize and standardize medical terminology, including medicine names and lab investigations.
- Expand common abbreviations where appropriate (e.g., BP -> Blood Pressure), unless they are universally accepted in clinical documentation (e.g., PRN).
- Standardize medication lines as: Brand Name (Generic Name) — Dosage | Frequency | Route | Duration. If brand/generic is ambiguous, prefer generic.
- Present a semi-structured, doctor-friendly summary with sections in this order if applicable:
  1) Chief Complaint
  2) History/Notes
  3) Examination/Clinical Findings
  4) Investigations (Lab/Imaging)
  5) Diagnosis/Impression
  6) Medications
  7) Advice/Instructions
- Keep it concise and clinically clear. Do not invent data not present in the transcript.
- Use bullet points where helpful. Use sentence case. Avoid markdown headings; just clear section titles followed by a colon.
`

    const prompt = `Raw Transcript:\n\n${transcript}\n\nPlease produce the refined, standardized, semi-structured output as per the instructions.`

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemInstruction },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    }

    console.log('Making request to Gemini API...')
    const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    console.log('Gemini API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error response:', errorText)
      return res.status(500).json({ error: 'Refinement failed', details: errorText })
    }

    const data = await response.json()
    console.log('Gemini API response structure:', JSON.stringify(data, null, 2))

    // Extract text from Gemini response with fallback
    let refinedText: string = ''
    const parts = data.candidates?.[0]?.content?.parts
    if (Array.isArray(parts) && parts.length > 0) {
      refinedText = parts.map((p: any) => p?.text || '').join('')
    }
    if (!refinedText && typeof data.candidates?.[0]?.content?.parts?.[0]?.text === 'string') {
      refinedText = data.candidates[0].content.parts[0].text
    }

    console.log('Extracted refined text length:', refinedText.length)

    if (!refinedText) {
      console.error('No refined text could be extracted from Gemini response')
      return res.status(500).json({ error: 'No refined text generated' })
    }

    console.log('Successfully refined transcript')
    return res.status(200).json({ refined: refinedText })

  } catch (error) {
    console.error('Refinement error details:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
