// Metodi con cui viene incassato un pagamento (scuola e ricevute). Stessi
// valori del check SQL su school_subscriptions / school_memberships / receipts.
export type IncassoMethod = "contanti" | "bonifico" | "pos"

export const INCASSO_METHODS: IncassoMethod[] = ["contanti", "bonifico", "pos"]

export const INCASSO_METHOD_LABELS: Record<IncassoMethod, string> = {
  contanti: "Contanti",
  bonifico: "Bonifico",
  pos: "POS",
}

// POS e bonifico finiscono insieme nella voce "elettronico" dei riepiloghi.
export function isElectronic(method: IncassoMethod): boolean {
  return method !== "contanti"
}
