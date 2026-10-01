import { useNavigate } from 'react-router-dom'
import ErrorState from '../components/ErrorState'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-nevoa">
      <ErrorState
        variant="neutro"
        title={<>Essa página <em className="italic font-semibold">não existe</em> por aqui.</>}
        subtitle="O endereço pode estar errado ou o conteúdo foi removido."
        primaryAction={{ label: 'Voltar ao Início', onClick: () => navigate('/') }}
      />
    </div>
  )
}
