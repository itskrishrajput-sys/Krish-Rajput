import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept mobile network dropout / chunk fetch errors
window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch') || msg.includes('Loading chunk')) {
    console.warn('Recovering from network load stall:', msg);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event?.reason || '');
  if (reason.includes('Failed to fetch') || reason.includes('dynamically imported module')) {
    console.warn('Suppressed unhandled network rejection on mobile boot:', reason);
    event.preventDefault();
  }
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class RootErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mobile Trade Hub ERP runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 text-center font-sans">
          <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-blue-400 mb-2">
              Mobile Trade Hub ERP
            </h2>
            <p className="text-xs text-slate-300 mb-4">
              ऐप को लोड करने में हल्की रुकावट आई है। कृपया नीचे दिया बटन दबाकर ऐप दोबारा लोड करें।
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              🔄 रीलोड करें (Reload App)
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Clean up raw HTML preloader immediately once the JS bundle executes
const preloaderEl = document.getElementById('app-preloader');
if (preloaderEl) {
  preloaderEl.remove();
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}
