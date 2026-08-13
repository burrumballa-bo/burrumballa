import { useNavigate } from "react-router-dom"
import { CalendarDays, LogOut, Plus, Settings } from "lucide-react"
import { toast } from "sonner"

import { supabase } from "@/lib/supabase"
import { useEventInfo } from "@/hooks/useEventInfo"
import { formatDateOnly } from "@/lib/datetime"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminHomePage() {
  const navigate = useNavigate()
  const eventInfoQuery = useEventInfo()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/admin/login", { replace: true })
  }

  const handleNewEvent = () => {
    toast("Presto disponibile", {
      description: "La creazione di nuovi eventi non è ancora attiva.",
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/impostazioni")}>
            <Settings />
            Impostazioni
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut />
            Esci
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Eventi</h2>
          <Button onClick={handleNewEvent}>
            <Plus />
            Nuovo evento
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            role="button"
            tabIndex={0}
            onClick={() => navigate("/admin/evento")}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate("/admin/evento")
            }}
            className="hover:border-primary/50 cursor-pointer transition-colors"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="text-muted-foreground size-4" />
                {eventInfoQuery.data?.titolo ?? "Evento"}
              </CardTitle>
              {eventInfoQuery.data?.data_evento && (
                <CardDescription>
                  {formatDateOnly(eventInfoQuery.data.data_evento)}
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
