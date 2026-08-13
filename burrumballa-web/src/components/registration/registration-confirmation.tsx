"use client"

import Link from "next/link"
import { Banknote, CalendarClock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatCurrency, type CalcolaTotaleResult } from "@/lib/registration/pricing"
import type { RegistrationFormValues } from "@/lib/registration/schema"
import { cn } from "@/lib/utils"

import { CopyableRow, DIAGONAL_CUT, SectionCard, deadlineFormatter } from "./shared"

export interface BonificoInfo {
  eventTitle: string
  iban: string
  intestatario: string
}

export const FALLBACK_BONIFICO_INFO: BonificoInfo = {
  eventTitle: "Senti Come Suona",
  iban: "IT00 X000 0000 0000 0000 0000 000",
  intestatario: "Burrumballa APS",
}

export interface RiepilogoIscrizione {
  values: RegistrationFormValues
  totale: CalcolaTotaleResult
  workshopLabel: string
  battleLabels: string[]
}

export function RegistrationConfirmation({
  riepilogo,
  deadline,
  bonificoInfo,
  onReset,
}: {
  riepilogo: RiepilogoIscrizione
  deadline: Date
  bonificoInfo: BonificoInfo
  // Nella pagina di conferma dedicata (/eventi/senti-come-suona/conferma)
  // non c'è uno stato di form da resettare: in quel caso si mostra un link
  // alla sezione iscrizione invece di un bottone stateful.
  onReset?: () => void
}) {
  const { values, totale, workshopLabel, battleLabels } = riepilogo
  const isBonifico = values.paymentMethod === "bonifico"
  const causale = `Iscrizione ${bonificoInfo.eventTitle} - ${values.nome} ${values.cognome}`

  return (
    <SectionCard accent="yellow">
      <CardHeader className="px-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-[#7ef58a]" />
          <p className="text-xs font-bold tracking-[0.12em] text-[#7ef58a] uppercase">
            Iscrizione completata
          </p>
        </div>
        <CardTitle className="font-[family-name:var(--font-anton)] text-2xl uppercase">
          Grazie, {values.nome}!
        </CardTitle>
        <CardDescription className="text-[13px] leading-relaxed text-white/75">
          La tua iscrizione è andata a buon fine. Dovresti aver già ricevuto
          un&apos;email di conferma a{" "}
          <span className="text-foreground font-semibold">
            {values.email}
          </span>
          : se non la vedi, controlla anche nella cartella spam.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-5">
        {isBonifico && (
          <div className="flex flex-col gap-3 rounded-[2px] border border-[#7c1fd6]/50 bg-[#7c1fd6]/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Banknote className="size-4 text-[#a855f7]" />
              Completa il pagamento con bonifico
            </div>

            <div className="flex flex-col gap-2.5">
              <CopyableRow label="IBAN" value={bonificoInfo.iban} />
              <CopyableRow
                label="Intestatario"
                value={bonificoInfo.intestatario}
                mono={false}
              />
              <CopyableRow label="Causale" value={causale} />
            </div>

            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <CalendarClock className="size-4 shrink-0" />
              Effettua il bonifico entro il{" "}
              {deadlineFormatter.format(deadline)} per confermare il posto.
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Una volta effettuato il bonifico, appena un nostro
              operatore ne confermerà la ricezione, riceverai la ricevuta di
              pagamento via email.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-[2px] border border-white/10 bg-[#111] p-4">
          <p className="mb-1 text-xs font-bold tracking-[0.12em] text-[#a855f7] uppercase">
            Riepilogo iscrizione
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nome</span>
            <span>
              {values.nome} {values.cognome} ({values.aka})
            </span>
          </div>
          {values.akaPartner2vs2 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Crew / partner 2vs2
              </span>
              <span>{values.akaPartner2vs2}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Workshop</span>
            <span>{workshopLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Battle</span>
            <span>{battleLabels.join(", ")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pagamento</span>
            <span>
              {isBonifico ? "Bonifico bancario" : "Contanti sul posto"}
            </span>
          </div>
          <div className="my-1 border-t border-white/10" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Workshop</span>
            <span>{formatCurrency(totale.amountWorkshop)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Battle</span>
            <span>{formatCurrency(totale.amountBattle)}</span>
          </div>
          {totale.surchargeLate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Sovrapprezzo ritardo
              </span>
              <span>{formatCurrency(totale.surchargeLate)}</span>
            </div>
          )}
          {totale.surchargeOnsite > 0 && (
            <div className="flex justify-between text-sm">
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
      </CardContent>
      <CardFooter className="flex flex-col gap-2 px-5 sm:flex-row">
        {onReset ? (
          <Button
            variant="outline"
            onClick={onReset}
            className="w-full rounded-[2px] border-white/20 bg-transparent sm:w-auto"
          >
            Nuova iscrizione
          </Button>
        ) : (
          <Button
            asChild
            variant="outline"
            className="w-full rounded-[2px] border-white/20 bg-transparent sm:w-auto"
          >
            <Link href="/eventi/senti-come-suona#iscrizione">
              Nuova iscrizione
            </Link>
          </Button>
        )}
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
