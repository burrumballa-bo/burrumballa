import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import AdminHomePage from "@/pages/AdminHomePage"
import ImpostazioniPage from "@/pages/ImpostazioniPage"
import EventDashboardPage from "@/pages/EventDashboardPage"
import EventoPaginaPage from "@/pages/EventoPaginaPage"
import EventoIscrittiPage from "@/pages/EventoIscrittiPage"
import ContenutiPage from "@/pages/ContenutiPage"
import ContenutiHomePage from "@/pages/contenuti/ContenutiHomePage"
import ContenutiCorsiPage from "@/pages/contenuti/ContenutiCorsiPage"
import ContenutiEventiPage from "@/pages/contenuti/ContenutiEventiPage"
import ContenutiChiSiamoPage from "@/pages/contenuti/ContenutiChiSiamoPage"
import ContenutiFooterPage from "@/pages/contenuti/ContenutiFooterPage"
import ContenutiTemaPage from "@/pages/contenuti/ContenutiTemaPage"
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
      <Route
        path="/admin/contenuti"
        element={
          <ProtectedRoute>
            <ContenutiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contenuti/home"
        element={
          <ProtectedRoute>
            <ContenutiHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contenuti/corsi"
        element={
          <ProtectedRoute>
            <ContenutiCorsiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contenuti/eventi"
        element={
          <ProtectedRoute>
            <ContenutiEventiPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contenuti/chi-siamo"
        element={
          <ProtectedRoute>
            <ContenutiChiSiamoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contenuti/footer"
        element={
          <ProtectedRoute>
            <ContenutiFooterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/contenuti/tema"
        element={
          <ProtectedRoute>
            <ContenutiTemaPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
