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
Your task is to extract ONLY the doctor's contribution (Section 4) from the given transcript. 
Do not include patient demographic details, clinic details, vitals, or investigation reports coming from other departments. 
Focus only on what the doctor dictated in terms of complaints, findings, diagnosis, prescriptions, investigations, and advice.

Instructions:
1. Carefully read the transcript and extract structured information.
2. If the doctor skips a section, return null for that field.
3. Prescribed investigations must always be returned as a list of test names.
4. Medicines must be structured objects with clear attributes.
5. Always output valid JSON only — no extra text, no explanation.

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
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const prompt = EXTRACTION_PROMPT.replace('{{transcript}}', transcript)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical AI assistant specialized in extracting structured prescription data from doctor dictations. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response
    const extractedData = JSON.parse(content) as PrescriptionData
    
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

module.exports = async function handler(
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
