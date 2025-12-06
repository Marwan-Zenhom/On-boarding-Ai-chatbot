import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Log to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '40px',
          textAlign: 'center',
          background: 'var(--background-primary, #1a1a1a)',
          color: 'var(--text-primary, #fff)',
          borderRadius: '12px',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            😵
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '12px',
            color: 'var(--text-primary, #fff)'
          }}>
            Something went wrong
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary, #888)',
            marginBottom: '24px',
            maxWidth: '400px'
          }}>
            We encountered an unexpected error. Please try again or refresh the page.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'var(--accent-color, #6366f1)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '500',
                background: 'transparent',
                color: 'var(--text-primary, #fff)',
                border: '1px solid var(--border-color, #333)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Refresh Page
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '24px',
              textAlign: 'left',
              width: '100%',
              maxWidth: '600px'
            }}>
              <summary style={{
                cursor: 'pointer',
                color: 'var(--text-secondary, #888)',
                fontSize: '12px'
              }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                marginTop: '12px',
                padding: '16px',
                background: 'var(--surface-secondary, #2a2a2a)',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '11px',
                color: '#ef4444'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

