import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FamilyProvider } from './context/FamilyContext'
import ProtectedRoute from './components/ProtectedRoute'
import RequireAuth from './components/RequireAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Agenda from './pages/Agenda'
import Guarda from './pages/Guarda'
import Saude from './pages/Saude'
import Terapia from './pages/Terapia'
import Conquistas from './pages/Conquistas'
import Decisoes from './pages/Decisoes'
import Emails from './pages/Emails'
import Lembretes from './pages/Lembretes'
import Documentos from './pages/Documentos'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FamilyProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={
              <RequireAuth><Onboarding /></RequireAuth>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="guarda" element={<Guarda />} />
              <Route path="saude" element={<Saude />} />
              <Route path="terapia" element={<Terapia />} />
              <Route path="conquistas" element={<Conquistas />} />
              <Route path="decisoes" element={<Decisoes />} />
              <Route path="emails" element={<Emails />} />
              <Route path="lembretes" element={<Lembretes />} />
              <Route path="documentos" element={<Documentos />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FamilyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
