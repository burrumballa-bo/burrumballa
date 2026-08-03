import { Routes, Route } from "react-router-dom"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/admin/LoginPage"
import AdminPage from "@/pages/admin/AdminPage"
import { ProtectedRoute } from "@/components/ProtectedRoute"

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
