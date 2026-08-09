import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
    confirmPassword: z
      .string()
      .min(6, "La password deve avere almeno 6 caratteri"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) })

  useEffect(() => {
    const init = async () => {
      // Il link di recupero puo' arrivare come `?code=...` (PKCE) oppure
      // come `#access_token=...&type=recovery` (implicit, gestito in modo
      // automatico da supabase-js grazie a detectSessionInUrl).
      const url = new URL(window.location.href)
      const code = url.searchParams.get("code")

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          setError("Il link di recupero non è valido o è scaduto.")
        }
      }

      const { data } = await supabase.auth.getSession()
      setValidSession(!!data.session)
      setReady(true)
    }

    init()

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" || session) {
          setValidSession(true)
        }
      }
    )

    return () => subscription.subscription.unsubscribe()
  }, [])

  const onSubmit = async (values: ResetPasswordForm) => {
    setError(null)
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate("/admin", { replace: true }), 1500)
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground text-sm">Verifica del link...</p>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Link non valido</h1>
          <p className="text-muted-foreground text-sm">
            {error ??
              "Questo link di recupero password non è valido o è scaduto."}
          </p>
          <Link
            to="/admin/login"
            className="text-primary text-sm underline underline-offset-2"
          >
            Torna al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Imposta una nuova password</h1>

        {success ? (
          <p className="text-muted-foreground text-sm">
            Password aggiornata. Verrai reindirizzato all'area
            amministrazione...
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">
                Nuova password
              </label>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Conferma password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Salvataggio in corso..." : "Salva nuova password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
