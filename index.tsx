import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("hafed.app Critical Error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          color: 'white',
          backgroundColor: '#0f172a',
          minHeight: '100vh',
          direction: 'ltr',
          fontFamily: 'sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ color: '#ef4444' }}>Runtime Error</h1>
          <p>The application could not start correctly.</p>
          <pre style={{
            color: '#fca5a5',
            backgroundColor: '#1e293b',
            padding: '20px',
            borderRadius: '12px',
            fontSize: '12px',
            marginTop: '20px'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px',
              padding: '12px 24px',
              backgroundColor: '#06b6d4',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Restart Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error("Failed to find root container");
}