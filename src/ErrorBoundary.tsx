import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen">
          <span className="crash-screen-icon">🙈</span>
          <p className="crash-screen-title">Vaya, algo se ha torcido</p>
          <p className="crash-screen-desc">
            Tus notas están a salvo, guardadas en este dispositivo. Recarga la
            página para seguir donde lo dejaste.
          </p>
          <button className="crash-screen-btn" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
