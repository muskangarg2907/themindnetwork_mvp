import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';

/**
 * Firebase Configuration Diagnostic Tool
 * 
 * This component checks if Firebase is properly configured
 * and displays helpful debugging information.
 * 
 * Usage: Add to your app temporarily for debugging
 * <FirebaseDiagnostic />
 */

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const FirebaseDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Check environment variables
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (apiKey && apiKey !== 'YOUR_API_KEY' && apiKey !== 'your_api_key_here') {
      diagnostics.push({
        test: 'Firebase API Key',
        status: 'pass',
        message: `Configured: ${apiKey.substring(0, 10)}...`
      });
    } else {
      diagnostics.push({
        test: 'Firebase API Key',
        status: 'fail',
        message: 'Not configured or using placeholder. Update .env file with real Firebase API key.'
      });
    }

    if (authDomain && authDomain !== 'YOUR_PROJECT_ID.firebaseapp.com') {
      diagnostics.push({
        test: 'Firebase Auth Domain',
        status: 'pass',
        message: `Configured: ${authDomain}`
      });
    } else {
      diagnostics.push({
        test: 'Firebase Auth Domain',
        status: 'fail',
        message: 'Not configured. Update VITE_FIREBASE_AUTH_DOMAIN in .env'
      });
    }

    if (projectId && projectId !== 'YOUR_PROJECT_ID' && projectId !== 'your-project-id') {
      diagnostics.push({
        test: 'Firebase Project ID',
        status: 'pass',
        message: `Configured: ${projectId}`
      });
    } else {
      diagnostics.push({
        test: 'Firebase Project ID',
        status: 'fail',
        message: 'Not configured. Update VITE_FIREBASE_PROJECT_ID in .env'
      });
    }

    // Test 2: Check Firebase Auth initialization
    if (auth) {
      diagnostics.push({
        test: 'Firebase Auth Instance',
        status: 'pass',
        message: 'Firebase Auth is initialized'
      });
    } else {
      diagnostics.push({
        test: 'Firebase Auth Instance',
        status: 'fail',
        message: 'Firebase Auth failed to initialize'
      });
    }

    // Test 3: Check reCAPTCHA container
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (recaptchaContainer) {
      diagnostics.push({
        test: 'reCAPTCHA Container',
        status: 'pass',
        message: 'reCAPTCHA container found in DOM'
      });
    } else {
      diagnostics.push({
        test: 'reCAPTCHA Container',
        status: 'fail',
        message: 'reCAPTCHA container not found. Should have id="recaptcha-container"'
      });
    }

    // Test 4: Check if running in development
    const isDev = import.meta.env.DEV;
    diagnostics.push({
      test: 'Environment Mode',
      status: 'pass',
      message: isDev ? 'Development mode' : 'Production mode'
    });

    // Test 5: Network connectivity
    try {
      const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
      diagnostics.push({
        test: 'Network Connectivity',
        status: 'pass',
        message: 'Internet connection is working'
      });
    } catch (error) {
      diagnostics.push({
        test: 'Network Connectivity',
        status: 'fail',
        message: 'No internet connection detected'
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <i className="fas fa-check-circle text-green-500"></i>;
      case 'fail':
        return <i className="fas fa-times-circle text-red-500"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle text-yellow-500"></i>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const allPassed = results.every(r => r.status === 'pass');
  const hasFailures = results.some(r => r.status === 'fail');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                <i className="fas fa-stethoscope text-teal-600"></i>
                Firebase Configuration Diagnostic
              </h1>
              <p className="text-slate-500 mt-1">Checking your Firebase OTP setup...</p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {isRunning ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Running...
                </>
              ) : (
                <>
                  <i className="fas fa-redo mr-2"></i>
                  Re-run Tests
                </>
              )}
            </button>
          </div>

          {/* Summary */}
          {results.length > 0 && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              allPassed ? 'bg-green-50 border-green-300' :
              hasFailures ? 'bg-red-50 border-red-300' :
              'bg-yellow-50 border-yellow-300'
            }`}>
              <div className="flex items-center gap-3">
                {allPassed ? (
                  <i className="fas fa-check-circle text-green-600 text-2xl"></i>
                ) : hasFailures ? (
                  <i className="fas fa-exclamation-circle text-red-600 text-2xl"></i>
                ) : (
                  <i className="fas fa-info-circle text-yellow-600 text-2xl"></i>
                )}
                <div>
                  <h3 className="font-bold text-lg">
                    {allPassed ? '✅ All Tests Passed!' :
                     hasFailures ? '❌ Configuration Issues Found' :
                     '⚠️ Some Warnings'}
                  </h3>
                  <p className="text-sm">
                    {allPassed ? 'Your Firebase OTP setup looks good!' :
                     hasFailures ? 'Please fix the issues below to enable OTP authentication.' :
                     'Review the warnings below.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Diagnostic Results */}
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)} transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{result.test}</h4>
                    <p className="text-sm text-slate-600 mt-1">{result.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          {hasFailures && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <i className="fas fa-lightbulb"></i>
                Next Steps to Fix
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Open <code className="bg-blue-100 px-2 py-0.5 rounded">.env</code> file in your project root</li>
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Firebase Console</a></li>
                <li>Get your Firebase credentials from Project Settings</li>
                <li>Update the <code className="bg-blue-100 px-2 py-0.5 rounded">VITE_FIREBASE_*</code> values in <code className="bg-blue-100 px-2 py-0.5 rounded">.env</code></li>
                <li>Enable Phone authentication in Firebase Console (Authentication → Sign-in method)</li>
                <li>Restart your development server: <code className="bg-blue-100 px-2 py-0.5 rounded">npm run dev</code></li>
                <li>Refresh this page to re-run diagnostics</li>
              </ol>
              <div className="mt-4 p-3 bg-white rounded border border-blue-300">
                <p className="text-xs text-blue-700">
                  📖 For detailed setup instructions, see <code className="bg-blue-100 px-2 py-0.5 rounded">FIREBASE_OTP_DEBUG.md</code>
                </p>
              </div>
            </div>
          )}

          {/* Environment Variables Display */}
          <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <i className="fas fa-cog"></i>
              Current Environment Variables
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-slate-500">VITE_FIREBASE_API_KEY:</span>
                <span className="text-slate-800">
                  {import.meta.env.VITE_FIREBASE_API_KEY ? 
                    `${import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 20)}...` : 
                    '❌ Not set'}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-slate-500">VITE_FIREBASE_AUTH_DOMAIN:</span>
                <span className="text-slate-800">
                  {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Not set'}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-white rounded">
                <span className="text-slate-500">VITE_FIREBASE_PROJECT_ID:</span>
                <span className="text-slate-800">
                  {import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
