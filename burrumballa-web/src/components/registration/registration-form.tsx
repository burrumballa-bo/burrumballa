"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
  FALLBACK_REGISTRATION_DEADLINE,
  NO_BATTLE_KEY,
  NO_WORKSHOP_KEY,
  ONSITE_SURCHARGE,
  calcolaTotale,
  formatCurrency,
  type CalcolaTotaleResult,
} from "@/lib/registration/pricing"
import {
  registrationDefaultValues,
  registrationSchema,
  type RegistrationFormValues,
} from "@/lib/registration/schema"
import type { EventOptionStato } from "@/lib/registration/types"

// PLACEHOLDER: sostituire con l'IBAN reale dell'associazione.
const IBAN_PLACEHOLDER = "IT00 X000 0000 0000 0000 0000 000"

const deadlineFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})

interface RiepilogoIscrizione {
  values: RegistrationFormValues
  totale: CalcolaTotaleResult
  workshopLabel: string
  battleLabels: string[]
}

export function RegistrationForm() {
  const [options, setOptions] = React.useState<EventOptionStato[] | null>(null)
  const [optionsError, setOptionsError] = React.useState<string | null>(null)
  const [deadline, setDeadline] = React.useState<Date>(FALLBACK_REGISTRATION_DEADLINE)
  const [riepilogo, setRiepilogo] = React.useState<RiepilogoIscrizione | null>(
    null
  )

  const loadOptions = React.useCallback(async () => {
    setOptionsError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("event_options_stato")
      .select("*")
      .order("ordine", { ascending: true })

    if (error) {
      setOptionsError(
        "Non è stato possibile caricare le opzioni di iscrizione. Riprova più tardi."
      )
      return
    }
    setOptions((data as EventOptionStato[]) ?? [])
  }, [])

  React.useEffect(() => {
    const supabase = createClient()
    supabase
      .from("event_info")
      .select("scadenza_iscrizioni")
      .eq("id", 1)
      .single()
      .then(({ data, error }) => {
        if (error || !data?.scadenza_iscrizioni) return
        setDeadline(new Date(data.scadenza_iscrizioni))
      })
  }, [])

  React.useEffect(() => {
    loadOptions()
  }, [loadOptions])

  const workshopOptions = React.useMemo(
    () => (options ?? []).filter((o) => o.tipo === "workshop"),
    [options]
  )
  const battleOptions = React.useMemo(
    () => (options ?? []).filter((o) => o.tipo === "battle"),
    [options]
  )

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: registrationDefaultValues,
  })

  const workshop = watch("workshop")
  const battleCategorie = watch("battleCategorie")
  const paymentMethod = watch("paymentMethod")

  const totale = React.useMemo(
    () =>
      calcolaTotale({
        workshop,
        battleCategorie,
        paymentMethod,
        workshopOptions,
        deadline,
      }),
    [workshop, battleCategorie, paymentMethod, workshopOptions, deadline]
  )

  async function onSubmit(values: RegistrationFormValues) {
    const totaleFinale = calcolaTotale({
      workshop: values.workshop,
      battleCategorie: values.battleCategorie,
      paymentMethod: values.paymentMethod,
      workshopOptions,
      deadline,
    })

    const workshopValue =
      values.workshop === NO_WORKSHOP_KEY ? null : values.workshop
    const battleCategoriesValue = values.battleCategorie.filter(
      (chiave) => chiave !== NO_BATTLE_KEY
    )

    const payload = {
      nome: values.nome,
      cognome: values.cognome,
      aka: values.aka,
      aka_partner_2vs2: values.akaPartner2vs2 || null,
      email: values.email,
      workshop: workshopValue,
      battle_categories: battleCategoriesValue,
      payment_method: values.paymentMethod,
      payment_status: "da_pagare" as const,
      amount_workshop: totaleFinale.amountWorkshop,
      amount_battle: totaleFinale.amountBattle,
      surcharge_late: totaleFinale.surchargeLate,
      surcharge_onsite: totaleFinale.surchargeOnsite,
      amount_total: totaleFinale.amountTotal,
      consenso_immagini: values.consensoImmagini === "si",
    }

    const supabase = createClient()
    const { error } = await supabase.from("registrations").insert(payload)

    if (error) {
      if (error.code === "23514") {
        toast.error("Posto non più disponibile", {
          description:
            "Una delle opzioni scelte è appena andata sold out. Scegli un'altra opzione qui sotto e riprova.",
        })
        await loadOptions()
      } else {
        toast.error("Iscrizione non riuscita", {
          description: "Si è verificato un errore. Riprova tra qualche istante.",
        })
      }
      return
    }

    const workshopLabel =
      workshopOptions.find((o) => o.chiave === values.workshop)?.label ??
      "Nessun workshop"
    const battleLabels =
      battleCategoriesValue.length > 0
        ? battleOptions
            .filter((o) => battleCategoriesValue.includes(o.chiave))
            .map((o) => o.label)
        : ["Nessuna battle"]

    try {
      await supabase.functions.invoke("send-registration-email", {
        body: {
          nome: values.nome,
          cognome: values.cognome,
          email: values.email,
          workshopLabel,
          battleLabels,
          paymentMethod: values.paymentMethod,
          amountTotal: totaleFinale.amountTotal,
        },
      })
    } catch {
      toast.warning(
        "Iscrizione registrata, ma l'invio dell'email di conferma non è riuscito."
      )
    }

    toast.success("Iscrizione registrata con successo!")
    setRiepilogo({ values, totale: totaleFinale, workshopLabel, battleLabels })
    reset(registrationDefaultValues)
  }

  if (riepilogo) {
    return (
      <RegistrationConfirmation
        riepilogo={riepilogo}
        deadline={deadline}
        onReset={() => setRiepilogo(null)}
      />
    )
  }

  if (optionsError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <TriangleAlert className="text-destructive size-8" />
          <p className="text-sm">{optionsError}</p>
          <Button variant="outline" onClick={loadOptions}>
            <RefreshCw className="size-4" />
            Riprova
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!options) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Caricamento opzioni…
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <Card>
        <CardHeader>
          <CardTitle>Dati anagrafici</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              autoComplete="given-name"
              aria-invalid={!!errors.nome}
              {...register("nome")}
            />
            {errors.nome && (
              <p className="text-destructive text-sm">
                Il nome è obbligatorio.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cognome">Cognome *</Label>
            <Input
              id="cognome"
              autoComplete="family-name"
              aria-invalid={!!errors.cognome}
              {...register("cognome")}
            />
            {errors.cognome && (
              <p className="text-destructive text-sm">
                Il cognome è obbligatorio.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="aka">Aka *</Label>
            <Input id="aka" aria-invalid={!!errors.aka} {...register("aka")} />
            {errors.aka && (
              <p className="text-destructive text-sm">
                L&apos;aka è obbligatorio.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="akaPartner2vs2">Aka 2vs2 (opzionale)</Label>
            <Input id="akaPartner2vs2" {...register("akaPartner2vs2")} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-sm">
                Inserisci un&apos;email valida.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workshop</CardTitle>
          <CardDescription>Scegli un&apos;opzione (obbligatorio).</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="workshop"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                {workshopOptions.map((opzione) => {
                  const disabled = opzione.sold_out
                  return (
                    <label
                      key={opzione.chiave}
                      htmlFor={`workshop-${opzione.chiave}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-accent/50 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          id={`workshop-${opzione.chiave}`}
                          value={opzione.chiave}
                          disabled={disabled}
                        />
                        <div>
                          <p className="text-sm font-medium">{opzione.label}</p>
                          {opzione.chiave !== NO_WORKSHOP_KEY && (
                            <p className="text-muted-foreground text-xs">
                              {formatCurrency(opzione.prezzo)}
                            </p>
                          )}
                        </div>
                      </div>
                      {disabled && <Badge variant="destructive">SOLD OUT</Badge>}
                    </label>
                  )
                })}
              </RadioGroup>
            )}
          />
          {errors.workshop && (
            <p className="text-destructive mt-2 text-sm">
              Seleziona un&apos;opzione workshop.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Battle</CardTitle>
          <CardDescription>
            Seleziona una o più categorie, oppure &quot;Nessuna battle&quot;. 1
            categoria: {formatCurrency(15)} · 2 categorie: {formatCurrency(20)}{" "}
            · 3 categorie: {formatCurrency(25)} · 4 categorie:{" "}
            {formatCurrency(30)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="battleCategorie"
            render={({ field }) => (
              <div className="flex flex-col gap-3">
                {battleOptions.map((opzione) => {
                  const isNoBattle = opzione.chiave === NO_BATTLE_KEY
                  const checked = field.value.includes(opzione.chiave)
                  const disabled = opzione.sold_out && !isNoBattle
                  return (
                    <label
                      key={opzione.chiave}
                      htmlFor={`battle-${opzione.chiave}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-accent/50 cursor-pointer"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`battle-${opzione.chiave}`}
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(value) => {
                            const isChecked = value === true
                            if (isNoBattle) {
                              field.onChange(isChecked ? [NO_BATTLE_KEY] : [])
                              return
                            }
                            const senzaNoBattle = field.value.filter(
                              (v) => v !== NO_BATTLE_KEY
                            )
                            field.onChange(
                              isChecked
                                ? [...senzaNoBattle, opzione.chiave]
                                : senzaNoBattle.filter(
                                    (v) => v !== opzione.chiave
                                  )
                            )
                          }}
                        />
                        <p className="text-sm font-medium">{opzione.label}</p>
                      </div>
                      {disabled && <Badge variant="destructive">SOLD OUT</Badge>}
                    </label>
                  )
                })}
              </div>
            )}
          />
          {errors.battleCategorie && (
            <p className="text-destructive mt-2 text-sm">
              Seleziona un&apos;opzione battle.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modalità di pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                <label
                  htmlFor="payment-bonifico"
                  className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem id="payment-bonifico" value="bonifico" />
                  <div>
                    <p className="text-sm font-medium">Bonifico bancario</p>
                    <p className="text-muted-foreground text-xs">
                      Il posto è confermato solo dopo il bonifico.
                    </p>
                  </div>
                </label>
                <label
                  htmlFor="payment-sul_posto"
                  className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem id="payment-sul_posto" value="sul_posto" />
                  <div>
                    <p className="text-sm font-medium">Sul posto</p>
                    <p className="text-muted-foreground text-xs">
                      +{formatCurrency(ONSITE_SURCHARGE)} rispetto al bonifico.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consenso alla pubblicazione di foto/video</CardTitle>
          <CardDescription>
            Acconsenti alla pubblicazione di foto e video dell&apos;evento in
            cui potresti comparire?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="consensoImmagini"
            render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange}>
                <label
                  htmlFor="consenso-si"
                  className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem id="consenso-si" value="si" />
                  <p className="text-sm font-medium">Sì, acconsento</p>
                </label>
                <label
                  htmlFor="consenso-no"
                  className="hover:bg-accent/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <RadioGroupItem id="consenso-no" value="no" />
                  <p className="text-sm font-medium">No, non acconsento</p>
                </label>
              </RadioGroup>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totale</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workshop</span>
            <span>{formatCurrency(totale.amountWorkshop)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Battle</span>
            <span>{formatCurrency(totale.amountBattle)}</span>
          </div>
          {totale.surchargeLate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Sovrapprezzo ritardo (dopo il{" "}
                {deadlineFormatter.format(deadline)})
              </span>
              <span>{formatCurrency(totale.surchargeLate)}</span>
            </div>
          )}
          {totale.surchargeOnsite > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Sovrapprezzo pagamento sul posto
              </span>
              <span>{formatCurrency(totale.surchargeOnsite)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Totale</span>
            <span>{formatCurrency(totale.amountTotal)}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Invio in corso…
              </>
            ) : (
              "Conferma iscrizione"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

function RegistrationConfirmation({
  riepilogo,
  deadline,
  onReset,
}: {
  riepilogo: RiepilogoIscrizione
  deadline: Date
  onReset: () => void
}) {
  const { values, totale, workshopLabel, battleLabels } = riepilogo
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-primary size-6" />
          <CardTitle>Iscrizione confermata</CardTitle>
        </div>
        <CardDescription>
          Abbiamo registrato la tua iscrizione. Riceverai anche un&apos;email
          di conferma a {values.email}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="grid gap-1">
          <p>
            <span className="text-muted-foreground">Nome:</span> {values.nome}{" "}
            {values.cognome} ({values.aka})
          </p>
          {values.akaPartner2vs2 && (
            <p>
              <span className="text-muted-foreground">Aka 2vs2:</span>{" "}
              {values.akaPartner2vs2}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Workshop:</span>{" "}
            {workshopLabel}
          </p>
          <p>
            <span className="text-muted-foreground">Battle:</span>{" "}
            {battleLabels.join(", ")}
          </p>
          <p>
            <span className="text-muted-foreground">Pagamento:</span>{" "}
            {values.paymentMethod === "bonifico"
              ? "Bonifico bancario"
              : "Sul posto"}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Workshop</span>
            <span>{formatCurrency(totale.amountWorkshop)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Battle</span>
            <span>{formatCurrency(totale.amountBattle)}</span>
          </div>
          {totale.surchargeLate > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Sovrapprezzo ritardo
              </span>
              <span>{formatCurrency(totale.surchargeLate)}</span>
            </div>
          )}
          {totale.surchargeOnsite > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Sovrapprezzo sul posto
              </span>
              <span>{formatCurrency(totale.surchargeOnsite)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Totale</span>
            <span>{formatCurrency(totale.amountTotal)}</span>
          </div>
        </div>

        {values.paymentMethod === "bonifico" && (
          <div className="border-primary/40 bg-primary/5 flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <Banknote className="size-4" />
              Dati per il bonifico
            </div>
            <p className="text-muted-foreground text-xs">
              IBAN (placeholder, verrà confermato dall&apos;organizzazione):{" "}
              <span className="text-foreground font-mono">
                {IBAN_PLACEHOLDER}
              </span>
            </p>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarClock className="size-4" />
              Scadenza: effettua il bonifico entro il{" "}
              {deadlineFormatter.format(deadline)} per confermare
              il posto.
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto"
        >
          Nuova iscrizione
        </Button>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/eventi/senti-come-suona">
            Torna alla pagina dell&apos;evento
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
