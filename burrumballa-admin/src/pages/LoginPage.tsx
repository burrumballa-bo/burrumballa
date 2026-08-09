import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "La password deve avere almeno 6 caratteri"),
})

type LoginForm = z.infer<typeof loginSchema>

const forgotPasswordSchema = z.object({
  email: z.string().email("Email non valida"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"login" | "forgot">("login")
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })
  const forgotForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onLogin = async (values: LoginForm) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(values)

    if (error) {
      setError(error.message)
      return
    }

    navigate("/admin", { replace: true })
  }

  const onForgotPassword = async (values: ForgotPasswordForm) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    if (error) {
      setError(error.message)
      return
    }

    setResetSent(true)
  }

  const backToLogin = () => {
    setMode("login")
    setError(null)
    setResetSent(false)
  }

  if (mode === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold">Recupera password</h1>

          {resetSent ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Se l'indirizzo inserito è registrato, riceverai a breve
                un'email con il link per reimpostare la password.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={backToLogin}
              >
                Torna al login
              </Button>
            </div>
          ) : (
            <form
              onSubmit={forgotForm.handleSubmit(onForgotPassword)}
              className="space-y-4"
            >
              <p className="text-muted-foreground text-sm">
                Inserisci la tua email: ti invieremo un link per reimpostare
                la password.
              </p>

              <div className="space-y-1">
                <label htmlFor="forgot-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="forgot-email"
                  type="email"
                  {...forgotForm.register("email")}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-destructive text-sm">
                    {forgotForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {error && <p className="text-destructive text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={forgotForm.formState.isSubmitting}
                className="w-full"
              >
                {forgotForm.formState.isSubmitting
                  ? "Invio in corso..."
                  : "Invia link di recupero"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={backToLogin}
              >
                Torna al login
              </Button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={loginForm.handleSubmit(onLogin)}
        className="w-full max-w-sm space-y-4"
      >
        <h1 className="text-2xl font-semibold">Accesso amministratore</h1>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input id="email" type="email" {...loginForm.register("email")} />
          {loginForm.formState.errors.email && (
            <p className="text-destructive text-sm">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setMode("forgot")
              }}
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
            >
              Password dimenticata?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            {...loginForm.register("password")}
          />
          {loginForm.formState.errors.password && (
            <p className="text-destructive text-sm">
              {loginForm.formState.errors.password.message}
            </p>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="submit"
          disabled={loginForm.formState.isSubmitting}
          className="w-full"
        >
          {loginForm.formState.isSubmitting ? "Accesso in corso..." : "Accedi"}
        </Button>
      </form>
    </div>
  )
}
