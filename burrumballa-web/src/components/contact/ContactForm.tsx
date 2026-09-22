"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  contactDefaultValues,
  contactSchema,
  type ContactFormValues,
} from "@/lib/contact/schema";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  /** Oggetto dell'email che arriva alla scuola (vedi lib/contact/intents). */
  topic: string;
  /** Messaggio già iniziato, quando il form si apre da un pulsante. */
  defaultMessage?: string;
  /** Nota facoltativa sotto al pulsante di invio. */
  note?: string;
  className?: string;
}

const LABEL_CLASS = "font-display text-[12px] tracking-[0.5px] uppercase";
const FIELD_CLASS =
  "border-bb-ink bg-bb-surface text-bb-ink placeholder:text-bb-ink/40 focus:border-bb-pink w-full border-[2.5px] px-3 py-2.5 text-[15px] outline-none transition-colors";
const ERROR_CLASS = "text-bb-pink text-[13px] font-semibold";

// Form contatti del sito pubblico: lo stesso componente sta nella sezione
// "scrivici" della home e dentro al popup aperto dai pulsanti (iscriviti a
// un corso, lezione di prova). L'indirizzo del destinatario non passa mai
// di qui: lo risolve la Edge Function leggendo le impostazioni admin.
export function ContactForm({
  topic,
  defaultMessage = "",
  note,
  className,
}: ContactFormProps) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  // Il form della home e quello dentro al popup possono essere montati
  // insieme: senza un prefisso per istanza gli id (e quindi le label) si
  // sovrapporrebbero.
  const fieldId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: contactDefaultValues(defaultMessage),
  });

  async function onSubmit(values: ContactFormValues) {
    // Same-origin: niente preflight CORS, quindi una sola chiamata per
    // invio. L'indirizzo del destinatario lo risolve la route lato server.
    let inviato = false;
    try {
      const response = await fetch("/api/contatti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          argomento: topic,
          pagina: window.location.pathname,
        }),
      });
      inviato = response.ok;
    } catch {
      inviato = false;
    }

    if (!inviato) {
      toast.error("Messaggio non inviato", {
        description:
          "Si è verificato un errore. Riprova tra qualche istante o scrivici su Instagram.",
      });
      return;
    }

    setSentTo(values.email);
    reset(contactDefaultValues(defaultMessage));
  }

  // Messaggio partito: al posto dei campi resta il ringraziamento, con
  // l'indirizzo a cui arriverà la risposta (utile per accorgersi di un
  // refuso nell'email). Vale sia in home che dentro al popup.
  if (sentTo) {
    return (
      <div className={cn("flex flex-col items-start gap-3", className)}>
        <div className="bg-bb-green font-display border-bb-ink border-[2.5px] px-3 py-1.5 text-[13px] text-[#1a1a1a]">
          MESSAGGIO INVIATO
        </div>
        <p className="font-display text-[20px] leading-[1.1] tracking-[-0.5px]">
          Grazie per averci scritto
        </p>
        <p className="text-[15px] leading-relaxed">
          Risponderemo il prima possibile a{" "}
          <strong className="break-all">{sentTo}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className="border-bb-ink border-b-2 pb-0.5 text-sm font-bold"
        >
          Scrivi un altro messaggio →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("flex flex-col gap-4", className)}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor={`${fieldId}-nome`}>
            Nome *
          </label>
          <input
            id={`${fieldId}-nome`}
            autoComplete="name"
            aria-invalid={!!errors.nome}
            className={FIELD_CLASS}
            {...register("nome")}
          />
          {errors.nome && <p className={ERROR_CLASS}>{errors.nome.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={LABEL_CLASS} htmlFor={`${fieldId}-email`}>
            Email *
          </label>
          <input
            id={`${fieldId}-email`}
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={FIELD_CLASS}
            {...register("email")}
          />
          {errors.email && (
            <p className={ERROR_CLASS}>{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor={`${fieldId}-telefono`}>
          Telefono (facoltativo)
        </label>
        <input
          id={`${fieldId}-telefono`}
          type="tel"
          autoComplete="tel"
          aria-invalid={!!errors.telefono}
          className={FIELD_CLASS}
          {...register("telefono")}
        />
        {errors.telefono && (
          <p className={ERROR_CLASS}>{errors.telefono.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className={LABEL_CLASS} htmlFor={`${fieldId}-messaggio`}>
          Messaggio *
        </label>
        <textarea
          id={`${fieldId}-messaggio`}
          rows={5}
          aria-invalid={!!errors.messaggio}
          className={cn(FIELD_CLASS, "resize-y")}
          {...register("messaggio")}
        />
        {errors.messaggio && (
          <p className={ERROR_CLASS}>{errors.messaggio.message}</p>
        )}
      </div>

      {/* Honeypot: invisibile e fuori dal flusso di tabulazione, quindi una
          persona non lo incontra mai. Se arriva compilato è un bot. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor={`${fieldId}-website`}>Non compilare questo campo</label>
        <input
          id={`${fieldId}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${fieldId}-consenso`}
          className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed"
        >
          <input
            id={`${fieldId}-consenso`}
            type="checkbox"
            className="accent-bb-pink mt-0.5 size-4 shrink-0"
            aria-invalid={!!errors.consenso}
            {...register("consenso")}
          />
          <span>
            Ho letto l&apos;
            <Link
              href="/privacy"
              target="_blank"
              className="underline underline-offset-2"
            >
              informativa privacy
            </Link>{" "}
            e acconsento al trattamento dei miei dati per ricevere una risposta.
            *
          </span>
        </label>
        {errors.consenso && (
          <p className={ERROR_CLASS}>{errors.consenso.message}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-bb-ink text-bb-cream inline-flex items-center gap-2 px-5 py-3.5 text-[15px] font-bold disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Invio in corso…" : "Invia il messaggio →"}
        </button>
        {note && <span className="text-[13px] opacity-70">{note}</span>}
      </div>
    </form>
  );
}
