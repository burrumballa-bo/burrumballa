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

// Taglio diagonale ricorrente nel design (tag, pillole, CTA).
const DIAGONAL_CUT = "[clip-path:polygon(0_0,100%_0,94%_100%,0_100%)]"

interface RiepilogoIscrizione {
  values: RegistrationFormValues
  totale: CalcolaTotaleResult
  workshopLabel: string
  battleLabels: string[]
}

function SectionCard({
  accent,
  children,
  className,
}: {
  accent: "purple" | "yellow" | "fuchsia"
  children: React.ReactNode
  className?: string
}) {
  const accentColor =
    accent === "purple"
      ? "border-t-[#7c1fd6]"
      : accent === "fuchsia"
        ? "border-t-[#d6249f]"
        : "border-t-[#f5d90a]"

  return (
    <Card
      className={cn(
        "gap-5 rounded-[2px] border-x-0 border-b-0 border-t-2 bg-[#050505] px-0 py-6 shadow-none",
        accentColor,
        className
      )}
    >
      {children}
    </Card>
  )
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
      data_nascita: values.dataNascita,
      telefono: values.telefono,
      citta: values.citta || null,
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
      consenso_regolamento: values.consensoRegolamento,
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
      <SectionCard accent="fuchsia">
        <CardContent className="flex flex-col items-center gap-4 px-5 py-10 text-center">
          <TriangleAlert className="text-destructive size-8" />
          <p className="text-sm">{optionsError}</p>
          <Button variant="outline" onClick={loadOptions}>
            <RefreshCw className="size-4" />
            Riprova
          </Button>
        </CardContent>
      </SectionCard>
    )
  }

  if (!options) {
    return (
      <SectionCard accent="purple">
        <CardContent className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
          <p className="text-muted-foreground text-sm">
            Caricamento opzioni…
          </p>
        </CardContent>
      </SectionCard>
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
      noValidate
    >
      <SectionCard accent="purple">
        <CardHeader className="px-5">
          <CardTitle className="font-[family-name:var(--font-anton)] text-lg uppercase">
            I tuoi dati
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome e cognome *</Label>
              <Input
                id="nome"
                placeholder="Nome"
                autoComplete="given-name"
                aria-invalid={!!errors.nome}
                className="rounded-[2px] bg-[#151515]"
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-destructive text-sm">
                  Il nome è obbligatorio.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cognome" className="sm:invisible">
                Cognome *
              </Label>
              <Input
                id="cognome"
                placeholder="Cognome"
                autoComplete="family-name"
                aria-invalid={!!errors.cognome}
                className="rounded-[2px] bg-[#151515]"
                {...register("cognome")}
              />
              {errors.cognome && (
                <p className="text-destructive text-sm">
                  Il cognome è obbligatorio.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="dataNascita">Data di nascita *</Label>
              <Input
                id="dataNascita"
                type="date"
                autoComplete="bday"
                aria-invalid={!!errors.dataNascita}
                className="rounded-[2px] bg-[#151515]"
                {...register("dataNascita")}
              />
              {errors.dataNascita && (
                <p className="text-destructive text-sm">
                  La data di nascita è obbligatoria.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="telefono">Telefono *</Label>
              <Input
                id="telefono"
                type="tel"
                autoComplete="tel"
                aria-invalid={!!errors.telefono}
                className="rounded-[2px] bg-[#151515]"
                {...register("telefono")}
              />
              {errors.telefono && (
                <p className="text-destructive text-sm">
                  Il telefono è obbligatorio.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className="rounded-[2px] bg-[#151515]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-destructive text-sm">
                  Inserisci un&apos;email valida.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="citta">Città</Label>
              <Input
                id="citta"
                autoComplete="address-level2"
                className="rounded-[2px] bg-[#151515]"
                {...register("citta")}
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#a855f7] uppercase">
              Nome d&apos;arte / Crew (per 2vs2)
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="aka">Nome d&apos;arte *</Label>
                <Input
                  id="aka"
                  aria-invalid={!!errors.aka}
                  className="rounded-[2px] bg-[#151515]"
                  {...register("aka")}
                />
                {errors.aka && (
                  <p className="text-destructive text-sm">
                    Il nome d&apos;arte è obbligatorio.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="akaPartner2vs2">
                  Crew / partner 2vs2 (opzionale)
                </Label>
                <Input
                  id="akaPartner2vs2"
                  className="rounded-[2px] bg-[#151515]"
                  {...register("akaPartner2vs2")}
                />
              </div>
            </div>
          </div>

          <Controller
            control={control}
            name="consensoRegolamento"
            render={({ field }) => (
              <label
                htmlFor="consenso-regolamento"
                className="mt-2 flex cursor-pointer items-start gap-2"
              >
                <Checkbox
                  id="consenso-regolamento"
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                  aria-invalid={!!errors.consensoRegolamento}
                  className="mt-0.5 rounded-none border-white/30 data-[state=checked]:border-[#f5d90a] data-[state=checked]:bg-[#f5d90a] data-[state=checked]:text-black"
                />
                <span className="text-muted-foreground text-xs leading-relaxed">
                  Accetto il regolamento dell&apos;evento e il trattamento dei
                  dati personali *
                </span>
              </label>
            )}
          />
          {errors.consensoRegolamento && (
            <p className="text-destructive -mt-2 text-sm">
              {errors.consensoRegolamento.message}
            </p>
          )}

          <div className="mt-1 flex flex-col gap-2 border-t border-white/10 pt-4">
            <p className="text-sm font-medium">
              Acconsenti alla pubblicazione di foto/video dell&apos;evento in
              cui potresti comparire?
            </p>
            <Controller
              control={control}
              name="consensoImmagini"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-2"
                >
                  <label
                    htmlFor="consenso-si"
                    className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-white/10 bg-[#151515] p-2.5 text-sm"
                  >
                    <RadioGroupItem id="consenso-si" value="si" />
                    Sì, acconsento
                  </label>
                  <label
                    htmlFor="consenso-no"
                    className="flex cursor-pointer items-center gap-2 rounded-[2px] border border-white/10 bg-[#151515] p-2.5 text-sm"
                  >
                    <RadioGroupItem id="consenso-no" value="no" />
                    No
                  </label>
                </RadioGroup>
              )}
            />
          </div>
        </CardContent>
      </SectionCard>

      <SectionCard accent="yellow">
        <CardHeader className="px-5">
          <CardTitle className="font-[family-name:var(--font-anton)] text-lg uppercase">
            Battle
          </CardTitle>
          <CardDescription className="text-xs font-bold tracking-[0.12em] text-[#a855f7] uppercase">
            Scegli le categorie
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5">
          <Controller
            control={control}
            name="battleCategorie"
            render={({ field }) => (
              <div className="flex flex-col gap-2">
                {battleOptions.map((opzione) => {
                  const isNoBattle = opzione.chiave === NO_BATTLE_KEY
                  const checked = field.value.includes(opzione.chiave)
                  const disabled = opzione.sold_out && !isNoBattle
                  return (
                    <label
                      key={opzione.chiave}
                      htmlFor={`battle-${opzione.chiave}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-[2px] border border-white/10 bg-[#151515] p-2.5 transition-colors",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:border-white/25"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`battle-${opzione.chiave}`}
                          checked={checked}
                          disabled={disabled}
                          className="rounded-none border-[#f5d90a]/70 data-[state=checked]:border-[#f5d90a] data-[state=checked]:bg-[#f5d90a] data-[state=checked]:text-black"
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
                        <p className="text-sm font-semibold">{opzione.label}</p>
                      </div>
                      {disabled ? (
                        <Badge variant="destructive" className="rounded-[2px]">
                          SOLD OUT
                        </Badge>
                      ) : (
                        !isNoBattle && (
                          <span className="text-sm font-semibold text-[#f5d90a]">
                            {formatCurrency(opzione.prezzo)}
                          </span>
                        )
                      )}
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
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Costo in base al numero di categorie scelte: {formatCurrency(15)} /{" "}
            {formatCurrency(20)} / {formatCurrency(25)} / {formatCurrency(30)}.
          </p>
        </CardContent>
      </SectionCard>

      <SectionCard accent="fuchsia">
        <CardHeader className="px-5">
          <p className="text-xs font-bold tracking-[0.12em] text-[#a855f7] uppercase">
            Workshop
          </p>
          <CardTitle className="font-[family-name:var(--font-anton)] text-lg uppercase">
            Scegli un&apos;opzione
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          <Controller
            control={control}
            name="workshop"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="gap-2"
              >
                {workshopOptions.map((opzione) => {
                  const disabled = opzione.sold_out
                  const isNoWorkshop = opzione.chiave === NO_WORKSHOP_KEY
                  return (
                    <label
                      key={opzione.chiave}
                      htmlFor={`workshop-${opzione.chiave}`}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-[2px] border p-2.5 transition-colors",
                        field.value === opzione.chiave
                          ? "border-[#f5d90a] bg-[#1a1a1a]"
                          : "border-white/10 bg-[#151515]",
                        disabled
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:border-white/25"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem
                          id={`workshop-${opzione.chiave}`}
                          value={opzione.chiave}
                          disabled={disabled}
                        />
                        <div>
                          <p className="text-sm font-semibold">{opzione.label}</p>
                          {!isNoWorkshop && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                              <span className="text-[#f5d90a]">
                                {formatCurrency(opzione.prezzo)}
                              </span>
                              {disabled ? (
                                <span className="font-semibold tracking-[0.08em] text-[#f87171] uppercase">
                                  ● Sold out
                                </span>
                              ) : (
                                <span className="font-semibold tracking-[0.08em] text-[#7ef58a] uppercase">
                                  ● Posti disponibili
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      {disabled && (
                        <Badge variant="destructive" className="rounded-[2px]">
                          SOLD OUT
                        </Badge>
                      )}
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
          <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
            Iscrizione a uno o entrambi i workshop, oppure &quot;Nessun
            workshop&quot; se partecipi solo alla battle.
          </p>
        </CardContent>
      </SectionCard>

      <SectionCard accent="yellow">
        <CardHeader className="px-5">
          <CardTitle className="font-[family-name:var(--font-anton)] text-lg uppercase">
            Riepilogo e pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-5">
          <div className="flex flex-col gap-1 text-sm">
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
            <div className="mt-2 flex justify-between border-t border-white/15 pt-2 text-base font-bold">
              <span>Totale</span>
              <span className="text-[#f5d90a]">
                {formatCurrency(totale.amountTotal)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-[family-name:var(--font-anton)] text-sm uppercase">
              Metodo di pagamento
            </p>
            <Controller
              control={control}
              name="paymentMethod"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange}>
                  <label
                    htmlFor="payment-bonifico"
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[2px] border p-2.5",
                      field.value === "bonifico"
                        ? "border-[#f5d90a] bg-[#1a1a1a]"
                        : "border-white/15 bg-[#151515]"
                    )}
                  >
                    <RadioGroupItem
                      id="payment-bonifico"
                      value="bonifico"
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold">Bonifico bancario</p>
                      <p className="text-muted-foreground text-xs">
                        Il posto è confermato solo dopo l&apos;accredito.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="payment-sul_posto"
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-[2px] border p-2.5",
                      field.value === "sul_posto"
                        ? "border-[#f5d90a] bg-[#1a1a1a]"
                        : "border-white/15 bg-[#151515]"
                    )}
                  >
                    <RadioGroupItem
                      id="payment-sul_posto"
                      value="sul_posto"
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold">Contanti sul posto</p>
                      <p className="text-xs font-medium text-[#f5d90a]">
                        +{formatCurrency(ONSITE_SURCHARGE)} di maggiorazione.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              )}
            />
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Il posto è confermato solo dopo il pagamento. Scadenza iscrizioni:{" "}
            {deadlineFormatter.format(deadline)} — dopo la scadenza: +
            {formatCurrency(5)}.
          </p>
        </CardContent>
        <CardFooter className="px-5">
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "h-auto w-full rounded-[2px] bg-[#f5d90a] py-3.5 text-sm font-bold tracking-[0.05em] text-black uppercase hover:bg-[#f5d90a]/90",
              DIAGONAL_CUT
            )}
          >
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
      </SectionCard>
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
    <SectionCard accent="yellow">
      <CardHeader className="px-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-6 text-[#7ef58a]" />
          <CardTitle className="font-[family-name:var(--font-anton)] text-lg uppercase">
            Iscrizione confermata
          </CardTitle>
        </div>
        <CardDescription>
          Abbiamo registrato la tua iscrizione. Riceverai anche un&apos;email
          di conferma a {values.email}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5 text-sm">
        <div className="grid gap-1">
          <p>
            <span className="text-muted-foreground">Nome:</span> {values.nome}{" "}
            {values.cognome} ({values.aka})
          </p>
          {values.akaPartner2vs2 && (
            <p>
              <span className="text-muted-foreground">Crew / partner 2vs2:</span>{" "}
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
              : "Contanti sul posto"}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-[2px] border border-white/10 bg-[#111] p-4">
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
          <div className="flex justify-between border-t border-white/15 pt-2 text-base font-bold">
            <span>Totale</span>
            <span className="text-[#f5d90a]">
              {formatCurrency(totale.amountTotal)}
            </span>
          </div>
        </div>

        {values.paymentMethod === "bonifico" && (
          <div className="flex flex-col gap-2 rounded-[2px] border border-[#7c1fd6]/50 bg-[#7c1fd6]/10 p-4">
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
      <CardFooter className="flex flex-col gap-2 px-5 sm:flex-row">
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full rounded-[2px] border-white/20 bg-transparent sm:w-auto"
        >
          Nuova iscrizione
        </Button>
        <Button
          asChild
          className={cn(
            "w-full rounded-[2px] bg-[#f5d90a] font-bold text-black uppercase hover:bg-[#f5d90a]/90 sm:w-auto",
            DIAGONAL_CUT
          )}
        >
          <Link href="/eventi/senti-come-suona">
            Torna alla pagina dell&apos;evento
          </Link>
        </Button>
      </CardFooter>
    </SectionCard>
  )
}
