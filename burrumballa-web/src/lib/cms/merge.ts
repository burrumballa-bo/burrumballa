// Merge ricorsivo di un valore parziale (jsonb dal DB, potenzialmente
// incompleto se un campo è stato aggiunto dopo che la riga era stata
// salvata) sopra un default tipizzato. Gli array vengono sostituiti per
// intero (non concatenati): coerente con l'uso nel CMS, dove un array
// jsonb rappresenta sempre una lista completa (es. i 4 "valori").
export function mergeWithDefaults<T>(defaults: T, override: unknown): T {
  if (override === null || override === undefined) return defaults
  if (Array.isArray(defaults) || Array.isArray(override)) {
    return (override as T) ?? defaults
  }
  if (typeof defaults === "object" && typeof override === "object") {
    const result = { ...(defaults as Record<string, unknown>) }
    for (const key of Object.keys(result)) {
      const overrideValue = (override as Record<string, unknown>)[key]
      if (overrideValue !== undefined) {
        result[key] = mergeWithDefaults(result[key], overrideValue)
      }
    }
    return result as T
  }
  return (override as T) ?? defaults
}
