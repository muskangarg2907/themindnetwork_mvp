import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-5">
              <i className="fas fa-triangle-exclamation text-red-500 text-2xl"></i>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600 text-sm mb-6">
              An unexpected error occurred. Your data has not been affected.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors mb-4"
            >
              <i className="fas fa-rotate-right"></i>
              Reload Page
            </button>
            <p className="text-xs text-slate-400">
              If this keeps happening, contact{' '}
              <a href="mailto:support@themindnetwork.in" className="text-teal-600 hover:underline">
                support@themindnetwork.in
              </a>
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
  }
}
