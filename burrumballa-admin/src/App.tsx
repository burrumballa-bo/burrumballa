import { Routes, Route, Navigate, useParams } from "react-router-dom"
import LoginPage from "@/pages/LoginPage"
import ResetPasswordPage from "@/pages/ResetPasswordPage"
import AdminHomePage from "@/pages/AdminHomePage"
import ImpostazioniPage from "@/pages/ImpostazioniPage"
import EventDashboardPage from "@/pages/EventDashboardPage"
import EventoPaginaPage from "@/pages/EventoPaginaPage"
import EventoIscrittiPage from "@/pages/EventoIscrittiPage"
import EventoSiBallaPage from "@/pages/EventoSiBallaPage"
import ContenutiHomePage from "@/pages/contenuti/ContenutiHomePage"
import ContenutiCorsiPage from "@/pages/contenuti/ContenutiCorsiPage"
import ContenutiClassiPage from "@/pages/contenuti/ContenutiClassiPage"
import ContenutiEventiPage from "@/pages/contenuti/ContenutiEventiPage"
import ContenutiChiSiamoPage from "@/pages/contenuti/ContenutiChiSiamoPage"
import ContenutiFooterPage from "@/pages/contenuti/ContenutiFooterPage"
import ContenutiTemaPage from "@/pages/contenuti/ContenutiTemaPage"
import ContenutiImpostazioniGeneraliPage from "@/pages/contenuti/ContenutiImpostazioniGeneraliPage"
import GestioneCorsiPage from "@/pages/GestioneCorsiPage"
import GestioneSitoPage from "@/pages/GestioneSitoPage"
import GestioneEventiPage from "@/pages/GestioneEventiPage"
import CorsiGestionePage from "@/pages/corsi/CorsiGestionePage"
import IscrittiScuolaPage from "@/pages/corsi/IscrittiScuolaPage"
import IncassiScuolaPage from "@/pages/corsi/IncassiScuolaPage"
import RicevutePage from "@/pages/RicevutePage"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AdminLayout } from "@/components/AdminLayout"

function LegacyEventRedirect() {
  const { page } = useParams()
  return <Navigate to={`/admin/eventi/1/${page ?? ""}`} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
      {/* Pagine riservate: un solo controllo di accesso e il menu laterale. */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminHomePage />} />
        <Route path="/admin/impostazioni" element={<ImpostazioniPage />} />
        <Route path="/admin/eventi/:eventId" element={<EventDashboardPage />} />
        <Route path="/admin/eventi/:eventId/pagina" element={<EventoPaginaPage />} />
        <Route path="/admin/eventi/:eventId/iscritti" element={<EventoIscrittiPage />} />
        <Route path="/admin/eventi/:eventId/si-balla" element={<EventoSiBallaPage />} />
        {/* Indirizzi di quando c'era un solo evento: portano al primo. */}
        <Route path="/admin/evento" element={<Navigate to="/admin/eventi/1" replace />} />
        <Route path="/admin/evento/:page" element={<LegacyEventRedirect />} />
        <Route path="/admin/contenuti/home" element={<ContenutiHomePage />} />
        <Route path="/admin/contenuti/corsi" element={<ContenutiCorsiPage />} />
        <Route path="/admin/contenuti/classi" element={<ContenutiClassiPage />} />
        <Route path="/admin/contenuti/eventi" element={<ContenutiEventiPage />} />
        <Route path="/admin/contenuti/chi-siamo" element={<ContenutiChiSiamoPage />} />
        <Route path="/admin/contenuti/footer" element={<ContenutiFooterPage />} />
        <Route path="/admin/contenuti/tema" element={<ContenutiTemaPage />} />
        <Route path="/admin/contenuti/impostazioni-generali" element={<ContenutiImpostazioniGeneraliPage />} />
        <Route path="/admin/corsi" element={<GestioneCorsiPage />} />
        <Route path="/admin/corsi/corsi" element={<CorsiGestionePage />} />
        <Route path="/admin/corsi/iscritti" element={<IscrittiScuolaPage />} />
        <Route path="/admin/corsi/incassi" element={<IncassiScuolaPage />} />
        <Route path="/admin/ricevute" element={<RicevutePage />} />
        <Route path="/admin/sito" element={<GestioneSitoPage />} />
        <Route path="/admin/eventi" element={<GestioneEventiPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}

export default App
