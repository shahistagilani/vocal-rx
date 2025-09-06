import { useLocation, useNavigate } from 'react-router-dom';

export default function PrescriptionPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prescriptionHtml } = location.state || {};

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=900,height=600');
    if (printWindow && prescriptionHtml) {
      printWindow.document.write(prescriptionHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleEmail = () => {
    // TODO: Implement email functionality
    alert('Email functionality will be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Recording
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Prescription Report
            </h1>
          </div>
        </div>

        {/* Preview */}
        <div className="p-6">
          <div 
            className="border border-gray-200 rounded-lg p-6 mb-6"
            dangerouslySetInnerHTML={{ __html: prescriptionHtml || '' }}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={handlePrint}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Prescription
            </button>
            <button
              onClick={handleEmail}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email to Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
