// Merge ricorsivo di un valore parziale (jsonb dal DB) sopra un default
// tipizzato: stessa logica di burrumballa-web/src/lib/cms/merge.ts, usata
// qui per inizializzare i form con valori sempre completi.
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
