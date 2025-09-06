import type { VercelRequest, VercelResponse } from '@vercel/node'

interface Medicine {
  brand_name: string | null
  generic_name: string | null
  dosage: string | null
  frequency: string | null
  route: string | null
  duration: string | null
  remarks: string | null
}

interface Advice {
  diet: string | null
  exercise: string | null
  sleep: string | null
  other: string | null
}

interface PrescriptionData {
  chief_complaints: string | null
  clinical_findings: string | null
  diagnosis: string | null
  prescribed_investigations: string[]
  medicines: Medicine[]
  advice: Advice
  followup_date: string | null
}

const EXTRACTION_PROMPT = `You are a medical prescription assistant. 
Your task is to extract ONLY the doctor's contribution (Section 4) from the spoken transcript of a clinical encounter. 

⚠️ Do NOT include clinic details, doctor details, patient demographics, or vitals (temperature, BP, height, weight, lab reports) because those come from other systems. 

Focus ONLY on these fields:

- chief_complaints (string)
- clinical_findings (string)
- diagnosis (string)
- prescribed_investigations (array of test names only, e.g., ["CBC", "Chest X-ray", "ECG"])
- medicines (array of objects: brand_name, generic_name, dosage, frequency, route, duration, remarks)
- advice (object: diet, exercise, sleep, other)
- followup_date (YYYY-MM-DD if mentioned, otherwise a week from todays date)

Rules:
- If the doctor mentions investigations, extract each test name as a separate list item (e.g., "Blood sugar fasting and postprandial" → ["Blood Sugar Fasting", "Blood Sugar Postprandial"]).
- Do not include phrases like "please check" or "investigations advised".
- If no investigations are mentioned, return an empty array [].
- If the doctor does not mention a field, set it to null (or empty array for lists).
- Do not invent or infer details beyond the transcript.
- Normalize medicine details: dosage units (mg/ml), frequency (OD, BD, TDS, QID, SOS), route (Oral, IV, IM, Topical), duration (days/weeks).

Transcript:
"""{{transcript}}"""

Return JSON with this schema:

{
  "chief_complaints": string or null,
  "clinical_findings": string or null,
  "diagnosis": string or null,
  "prescribed_investigations": [ "Test 1", "Test 2", ... ],
  "medicines": [
    {
      "brand_name": string or null,
      "generic_name": string or null,
      "dosage": string or null,
      "frequency": string or null,
      "route": string or null,
      "duration": string or null,
      "remarks": string or null
    }
  ],
  "advice": {
    "diet": string or null,
    "exercise": string or null,
    "sleep": string or null,
    "other": string or null
  },
  "followup_date": string (YYYY-MM-DD) or null
}`

async function extractPrescriptionData(transcript: string): Promise<PrescriptionData> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured')
  }

  const prompt = `You are a medical AI assistant specialized in extracting structured prescription data from doctor dictations. Always respond with valid JSON only.

${EXTRACTION_PROMPT.replace('{{transcript}}', transcript)}`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
          topP: 0.8,
          topK: 10
        }
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error('No response from Gemini')
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanContent = content.trim()
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }

    // Parse the JSON response
    const extractedData = JSON.parse(cleanContent) as PrescriptionData
    
    // Validate the structure
    if (!extractedData || typeof extractedData !== 'object') {
      throw new Error('Invalid response format from LLM')
    }

    return extractedData

  } catch (error) {
    console.error('LLM extraction error:', error)
    
    // Fallback to basic extraction if LLM fails
    return {
      chief_complaints: transcript.length > 50 ? transcript.substring(0, 100) + '...' : transcript,
      clinical_findings: null,
      diagnosis: null,
      prescribed_investigations: [],
      medicines: [],
      advice: {
        diet: null,
        exercise: null,
        sleep: null,
        other: null
      },
      followup_date: null
    }
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { transcript } = req.body

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript is required' })
    }

    // For now, return mock data based on the transcript content
    // In production, this would call an LLM API (OpenAI, Anthropic, etc.)
    const extractedData: PrescriptionData = await extractPrescriptionData(transcript)

    res.status(200).json(extractedData)
  } catch (error) {
    console.error('Error extracting prescription:', error)
    res.status(500).json({ error: 'Failed to extract prescription data' })
  }
}
