import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FamilyProvider } from './context/FamilyContext'
import ProtectedRoute from './components/ProtectedRoute'
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Saude from './pages/Saude'
import Decisoes from './pages/Decisoes'
import Documentos from './pages/Documentos'
import Join from './pages/Join'
import Admin from './pages/Admin'
import Bolsa from './pages/Bolsa'
import Despesas from './pages/Despesas'
import Notificacoes from './pages/Notificacoes'
import Preferencias from './pages/Preferencias'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'
import Privacidade from './pages/Privacidade'
import Termos from './pages/Termos'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <OfflineBanner />
        <AuthProvider>
          <FamilyProvider>
            <Routes>
              <Route path="/privacidade" element={<Privacidade />} />
              <Route path="/termos" element={<Termos />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={
                <RequireAuth><Onboarding /></RequireAuth>
              } />
              <Route path="/join/:code" element={
                <RequireAuth><Join /></RequireAuth>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="guarda" element={<Navigate to="/agenda" replace />} />
                <Route path="saude" element={<Saude />} />
                <Route path="decisoes" element={<Decisoes />} />
                <Route path="lembretes" element={<Navigate to="/notificacoes" replace />} />
                <Route path="documentos" element={<Documentos />} />
                <Route path="admin" element={<Admin />} />
                <Route path="bolsa" element={<Bolsa />} />
                <Route path="despesas" element={<Despesas />} />
                <Route path="notificacoes" element={<Notificacoes />} />
                <Route path="preferencias" element={<Preferencias />} />
                <Route path="perfil" element={<Perfil />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FamilyProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
