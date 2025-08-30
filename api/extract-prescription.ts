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
  // Mock extraction logic - replace with actual LLM API call
  const lowerTranscript = transcript.toLowerCase()
  
  // Extract chief complaints
  let chiefComplaints: string | null = null
  if (lowerTranscript.includes('chest pain')) {
    chiefComplaints = 'Chest pain and shortness of breath'
  } else if (lowerTranscript.includes('headache')) {
    chiefComplaints = 'Headache'
  }

  // Extract clinical findings
  let clinicalFindings: string | null = null
  if (lowerTranscript.includes('bp') || lowerTranscript.includes('blood pressure')) {
    clinicalFindings = 'BP 140/90, HR 88, RR 18, Temp 98.6'
  }

  // Extract diagnosis
  let diagnosis: string | null = null
  if (lowerTranscript.includes('angina')) {
    diagnosis = 'Possible angina, rule out MI'
  } else if (lowerTranscript.includes('hypertension')) {
    diagnosis = 'Essential hypertension'
  }

  // Extract investigations
  const investigations: string[] = []
  if (lowerTranscript.includes('ecg')) {
    investigations.push('ECG')
  }
  if (lowerTranscript.includes('cardiac enzymes')) {
    investigations.push('Cardiac enzymes')
  }
  if (lowerTranscript.includes('blood test')) {
    investigations.push('Complete blood count')
  }

  // Extract medicines
  const medicines: Medicine[] = []
  if (lowerTranscript.includes('aspirin')) {
    medicines.push({
      brand_name: null,
      generic_name: 'Aspirin',
      dosage: '325mg',
      frequency: 'daily',
      route: 'oral',
      duration: null,
      remarks: null
    })
  }
  if (lowerTranscript.includes('nitroglycerin')) {
    medicines.push({
      brand_name: null,
      generic_name: 'Nitroglycerin',
      dosage: null,
      frequency: 'PRN',
      route: 'sublingual',
      duration: null,
      remarks: 'for chest pain'
    })
  }

  // Extract advice
  const advice: Advice = {
    diet: null,
    exercise: null,
    sleep: null,
    other: 'Follow up in 1 week'
  }

  // Extract followup date
  let followupDate: string | null = null
  if (lowerTranscript.includes('follow up') || lowerTranscript.includes('followup')) {
    // Set followup to 1 week from now
    const date = new Date()
    date.setDate(date.getDate() + 7)
    followupDate = date.toISOString().split('T')[0]
  }

  return {
    chief_complaints: chiefComplaints,
    clinical_findings: clinicalFindings,
    diagnosis: diagnosis,
    prescribed_investigations: investigations,
    medicines: medicines,
    advice: advice,
    followup_date: followupDate
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
