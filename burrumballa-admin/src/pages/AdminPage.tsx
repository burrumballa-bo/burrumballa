import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Area amministrazione</h1>
        <Button variant="outline" onClick={handleLogout}>
          Esci
        </Button>
      </div>
      <p className="text-muted-foreground">Contenuto protetto.</p>
    </div>
  )
}
