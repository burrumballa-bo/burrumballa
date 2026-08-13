import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import AdminHomePage from "@/pages/AdminHomePage"
import ImpostazioniPage from "@/pages/ImpostazioniPage"
import EventDashboardPage from "@/pages/EventDashboardPage"
import EventoPaginaPage from "@/pages/EventoPaginaPage"
import EventoIscrittiPage from "@/pages/EventoIscrittiPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/impostazioni"
        element={
          <ProtectedRoute>
            <ImpostazioniPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evento"
        element={
          <ProtectedRoute>
            <EventDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evento/pagina"
        element={
          <ProtectedRoute>
            <EventoPaginaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/evento/iscritti"
        element={
          <ProtectedRoute>
            <EventoIscrittiPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
