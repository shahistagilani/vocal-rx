import type { VercelRequest, VercelResponse } from '@vercel/node'

module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    const { transcript } = req.body as { transcript?: string }

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required' })
    }

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

    const response = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return res.status(500).json({ error: 'Refinement failed' })
    }

    const data = await response.json()

    // Extract text from Gemini response with fallback
    let refinedText: string = ''
    const parts = data.candidates?.[0]?.content?.parts
    if (Array.isArray(parts) && parts.length > 0) {
      refinedText = parts.map((p: any) => p?.text || '').join('')
    }
    if (!refinedText && typeof data.candidates?.[0]?.content?.parts?.[0]?.text === 'string') {
      refinedText = data.candidates[0].content.parts[0].text
    }

    if (!refinedText) {
      return res.status(500).json({ error: 'No refined text generated' })
    }

    return res.status(200).json({ refined: refinedText })

  } catch (error) {
    console.error('Refinement error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
