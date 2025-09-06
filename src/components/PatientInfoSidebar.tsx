import { useState } from 'react'

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

interface PatientInfoSidebarProps {
  patientData: PatientData
}

export default function PatientInfoSidebar({ patientData }: PatientInfoSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={`bg-white rounded-lg shadow-sm transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-full'}`}>
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg 
            className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-6">
          {/* Patient Photo & Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{patientData.name}</h3>
                <p className="text-gray-600">ID: {patientData.id}</p>
                <p className="text-gray-600">{patientData.age} years old • {patientData.gender}</p>
              </div>
            </div>
          </div>

          {/* Known Conditions */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Known Medical Conditions
            </h4>
            <div className="space-y-2">
              {patientData.conditions.map((condition, index) => (
                <span key={index} className="inline-block bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs mr-2 mb-2">
                  {condition}
                </span>
              ))}
            </div>
          </div>

          {/* Vitals Snapshot */}
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Vitals
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">BP:</span>
                <span className="font-medium">{patientData.vitals.bloodPressure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temp:</span>
                <span className="font-medium">{patientData.vitals.temperature}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium">{patientData.vitals.weight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Height:</span>
                <span className="font-medium">{patientData.vitals.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">HR:</span>
                <span className="font-medium">{patientData.vitals.heartRate}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Updated: {patientData.vitals.lastUpdated}
              </div>
            </div>
          </div>

          {/* Recent Lab Results */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lab Results
            </h4>
            <div className="space-y-2">
              {patientData.labResults.map((lab, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded p-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{lab.test}</p>
                    <p className="text-xs text-gray-600">{lab.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{lab.result}</p>
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
      )}
    </div>
  )
}
