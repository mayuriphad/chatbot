import React from 'react';
import ChatBot from './components/ChatBot';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Medical Assistant</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered Health Information Assistant
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get general information about symptoms and conditions. Our AI assistant is here to help provide educational insights, but remember to always consult healthcare professionals for proper medical advice.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-600 text-2xl">🩺</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Symptom Analysis</h3>
            <p className="text-gray-600">Describe your symptoms and get information about possible conditions and next steps.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-600 text-2xl">💡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Health Insights</h3>
            <p className="text-gray-600">Get general health information and educational content about various medical topics.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-600 text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Focused</h3>
            <p className="text-gray-600">Your conversations are processed securely with appropriate medical disclaimers.</p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-600 font-bold">!</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Medical Notice</h3>
              <p className="text-amber-700 mb-3">
                This AI assistant provides general health information for educational purposes only. It should not be used as a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <ul className="text-amber-700 space-y-1 text-sm list-disc list-inside">
                <li>Always consult with qualified healthcare professionals for medical concerns</li>
                <li>Seek immediate medical attention for emergencies</li>
                <li>Do not delay professional medical advice based on information from this assistant</li>
                <li>This tool is not intended to diagnose, treat, cure, or prevent any disease</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Ready to get started? Click the chat button in the bottom right corner!</p>
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <span>💬</span>
            <span className="font-medium">Start chatting with the Medical Assistant</span>
          </div>
        </div>
      </main>

      {/* ChatBot Component */}
      <ChatBot />
    </div>
  );
}

export default App;