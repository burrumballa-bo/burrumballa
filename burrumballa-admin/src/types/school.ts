export interface SchoolSubscription {
  id: string
  student_id: string
  description: string
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
  description: string
  start_date: string
  end_date: string
}

export interface SchoolStudentSaveInput {
  id?: string
  student: SchoolStudentInput
  classIds: string[]
  subscriptions: SubscriptionInput[]
}
