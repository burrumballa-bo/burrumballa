export type SubscriptionKind = "monthly" | "quarterly" | "entries"

export interface SchoolSubscription {
  id: string
  student_id: string
  kind: SubscriptionKind
  /** Numero di ingressi (1..10), solo per kind = "entries". */
  entries: number | null
  /** Ingressi gia' effettuati (0..entries). */
  entries_used: number
  price: number
  start_date: string
  end_date: string
}

export interface SchoolStudent {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  notes: string | null
  /** Id delle classi (course_levels) a cui l'iscritto è assegnato. */
  classIds: string[]
  subscriptions: SchoolSubscription[]
}

export interface SchoolStudentInput {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  birth_date: string | null
  notes: string | null
}

export interface SubscriptionInput {
  kind: SubscriptionKind
  entries: number | null
  entries_used: number
  price: number
  start_date: string
  end_date: string
}

export interface SchoolStudentSaveInput {
  id?: string
  student: SchoolStudentInput
  classIds: string[]
  subscriptions: SubscriptionInput[]
}
