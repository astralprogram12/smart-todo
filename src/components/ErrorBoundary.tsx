import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-sm text-red-800 font-medium">{this.state.error?.toString()}</p>
            </div>
            {this.state.errorInfo && (
              <details className="mt-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-60">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
