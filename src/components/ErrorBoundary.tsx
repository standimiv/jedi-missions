import React, {Component, ErrorInfo, ReactNode} from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    // Clear error state and reload the page
    window.location.reload();
  };

  handleReset = () => {
    // Clear error state without reloading
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            {/* Sith-themed error display */}
            <div className="error-header">
              <div className="error-icon">
                <span className="sith-symbol">⚡</span>
              </div>
              <h1 className="error-title">
                Disturbance in the Force
              </h1>
              <p className="error-subtitle">
                The dark side has corrupted your missions
              </p>
            </div>

            <div className="error-details">
              <div className="error-message">
                <h3>What happened?</h3>
                <p>
                  An unexpected error occurred while managing your Jedi missions.
                  The Force is strong, but sometimes even Jedi encounters technical difficulties.
                </p>

                {/* Show error details in development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="error-technical">
                    <summary>Technical Details (Development)</summary>
                    <div className="error-stack">
                      <strong>Error:</strong> {this.state.error.message}
                      <br />
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo?.componentStack}</pre>
                    </div>
                  </details>
                )}
              </div>

              <div className="error-suggestions">
                <h3>How to restore balance:</h3>
                <ul>
                  <li>🔄 Try reloading the page</li>
                  <li>🧹 Clear your browser cache</li>
                  <li>🌐 Check your internet connection</li>
                  <li>⏰ Wait a moment and try again</li>
                </ul>
              </div>
            </div>

            <div className="error-actions">
              <button
                className="action-btn primary-btn"
                onClick={this.handleReload}
              >
                <span className="btn-icon">🔄</span>
                Reload Application
              </button>

              <button
                className="action-btn secondary-btn"
                onClick={this.handleReset}
              >
                <span className="btn-icon">🔧</span>
                Try Again
              </button>
            </div>

            <div className="error-footer">
              <p className="error-quote">
                "Do or do not, there is no try... but sometimes a reload helps."
                <span className="quote-author">— Master Yoda (probably)</span>
              </p>
            </div>
          </div>

          {/* Background decorative elements */}
          <div className="error-background">
            <div className="error-particle"></div>
            <div className="error-particle"></div>
            <div className="error-particle"></div>
            <div className="error-lightning"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;