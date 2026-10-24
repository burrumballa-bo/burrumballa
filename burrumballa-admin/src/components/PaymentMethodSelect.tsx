import { Select } from "@/components/ui/select"
import { INCASSO_METHODS, INCASSO_METHOD_LABELS, type IncassoMethod } from "@/lib/paymentMethods"

interface PaymentMethodSelectProps {
  value: IncassoMethod | ""
  onChange: (value: IncassoMethod | "") => void
  /** Testo dell'opzione vuota: "Da pagare" dove e' uno stato valido, altrimenti un invito a scegliere. */
  emptyLabel: string
  /** L'opzione vuota e' selezionabile (es. abbonamento "da pagare"). */
  allowEmpty?: boolean
  className?: string
  "aria-label"?: string
  id?: string
}

export function PaymentMethodSelect({
  value,
  onChange,
  emptyLabel,
  allowEmpty = false,
  className,
  id,
  "aria-label": ariaLabel,
}: PaymentMethodSelectProps) {
  return (
    <Select
      id={id}
      aria-label={ariaLabel ?? "Metodo di pagamento"}
      aria-invalid={!allowEmpty && value === ""}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value as IncassoMethod | "")}
    >
      <option value="" disabled={!allowEmpty}>
        {emptyLabel}
      </option>
      {INCASSO_METHODS.map((m) => (
        <option key={m} value={m}>
          {INCASSO_METHOD_LABELS[m]}
        </option>
      ))}
    </Select>
  )
}
