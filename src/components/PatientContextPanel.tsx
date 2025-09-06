
interface PatientData {
  id: string
  name: string
  age: number
  gender: string
  photo: string
  conditions: string[]
  vitals: {
    bloodPressure: string
    temperature: string
    weight: string
    height: string
    heartRate: string
    lastUpdated: string
  }
  labResults: {
    test: string
    result: string
    date: string
    status: 'normal' | 'abnormal' | 'critical'
  }[]
}

interface PatientContextPanelProps {
  isOpen: boolean
  onClose: () => void
  patientData: PatientData
}

export default function PatientContextPanel({ isOpen, onClose, patientData }: PatientContextPanelProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Patient Context</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient Summary */}
            <div className="space-y-6">
              {/* Patient Photo & Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{patientData.name}</h3>
                    <p className="text-gray-600">ID: {patientData.id}</p>
                    <p className="text-gray-600">{patientData.age} years old • {patientData.gender}</p>
                  </div>
                </div>
              </div>

              {/* Known Conditions */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Known Medical Conditions
                </h4>
                <div className="space-y-2">
                  {patientData.conditions.map((condition, index) => (
                    <span key={index} className="inline-block bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Vitals & Lab Results */}
            <div className="space-y-6">
              {/* Vitals Snapshot */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Vitals
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">BP:</span>
                    <span className="ml-2 font-medium">{patientData.vitals.bloodPressure}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Temp:</span>
                    <span className="ml-2 font-medium">{patientData.vitals.temperature}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Weight:</span>
                    <span className="ml-2 font-medium">{patientData.vitals.weight}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Height:</span>
                    <span className="ml-2 font-medium">{patientData.vitals.height}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">HR:</span>
                    <span className="ml-2 font-medium">{patientData.vitals.heartRate}</span>
                  </div>
                  <div className="text-xs text-gray-500 col-span-2">
                    Updated: {patientData.vitals.lastUpdated}
                  </div>
                </div>
              </div>

              {/* Recent Lab Results */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Lab Results
                </h4>
                <div className="space-y-3">
                  {patientData.labResults.map((lab, index) => (
                    <div key={index} className="flex items-center justify-between bg-white rounded p-3">
                      <div>
                        <p className="font-medium text-gray-900">{lab.test}</p>
                        <p className="text-sm text-gray-600">{lab.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{lab.result}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          lab.status === 'normal' ? 'bg-green-100 text-green-800' :
                          lab.status === 'abnormal' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {lab.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl">
          <p className="text-sm text-gray-600 text-center">
            Your Trusted Medical Care Partner
          </p>
        </div>
      </div>
    </div>
  )
}
