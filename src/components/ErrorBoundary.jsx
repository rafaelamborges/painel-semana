import { Component } from 'react'
import ErrorState from './ErrorState'

// React class component — único jeito de capturar erros de render dos filhos.
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log local — se tivesse Sentry/PostHog seria aqui
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  reload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-nevoa">
        <ErrorState
          title={<>Algo <em className="italic font-semibold">quebrou</em> nessa tela.</>}
          subtitle="Recarregar a página costuma resolver. Se continuar, me avise."
          primaryAction={{ label: 'Recarregar', onClick: this.reload }}
          secondaryAction={{ label: 'Voltar ao Início', onClick: () => { this.reset(); window.location.href = '/' } }}
          detail={this.state.error?.message}
        />
      </div>
    )
  }
}
