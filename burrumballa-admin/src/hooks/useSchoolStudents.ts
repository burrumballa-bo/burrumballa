import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  SchoolMembership,
  SchoolStudent,
  SchoolStudentSaveInput,
  SchoolSubscription,
} from "@/types/school"

const KEY = ["school-students"]

type SubscriptionRow = Omit<SchoolSubscription, "entry_dates"> & {
  entries_log: { used_on: string }[] | null
}

export function useSchoolStudents() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SchoolStudent[]> => {
      const { data, error } = await supabase
        .from("school_students")
        .select(
          "*, classes:school_student_classes(course_level_id), subscriptions:school_subscriptions(*, entries_log:school_subscription_entries(used_on)), memberships:school_memberships(*)"
        )
        .order("last_name", { ascending: true })

      if (error) throw error
      return (data ?? []).map(({ classes, subscriptions, memberships, ...student }) => ({
        ...student,
        classIds: (classes ?? []).map((c: { course_level_id: string }) => c.course_level_id),
        subscriptions: (subscriptions ?? [])
          .map(({ entries_log, ...s }: SubscriptionRow) => ({
            ...s,
            price: Number(s.price),
            entry_dates: (entries_log ?? []).map((e) => e.used_on).sort(),
          }))
          .sort((a: SchoolSubscription, b: SchoolSubscription) =>
            b.start_date.localeCompare(a.start_date)
          ),
        memberships: (memberships ?? []).map((m: SchoolMembership) => ({
          ...m,
          card_price: m.card_price == null ? null : Number(m.card_price),
          fee_price: m.fee_price == null ? null : Number(m.fee_price),
        })),
      }))
    },
  })
}

// Salva tutta la scheda in un colpo: anagrafica, classi (riallineate con
// delete + insert), abbonamenti (nuovi, modificati ed eliminati) e
// tessere/quote delle stagioni toccate. Restituisce l'id dell'iscritto.
export function useSaveSchoolStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      student,
      classIds,
      subscriptions,
      deletedSubscriptionIds,
      memberships,
    }: SchoolStudentSaveInput): Promise<string> => {
      let studentId = id
      if (studentId) {
        const { error } = await supabase.from("school_students").update(student).eq("id", studentId)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("school_students")
          .insert(student)
          .select("id")
          .single()
        if (error) throw error
        studentId = data.id as string
      }

      const delClasses = await supabase
        .from("school_student_classes")
        .delete()
        .eq("student_id", studentId)
      if (delClasses.error) throw delClasses.error
      if (classIds.length > 0) {
        const { error } = await supabase
          .from("school_student_classes")
          .insert(classIds.map((course_level_id) => ({ student_id: studentId, course_level_id })))
        if (error) throw error
      }

      if (deletedSubscriptionIds.length > 0) {
        const { error } = await supabase
          .from("school_subscriptions")
          .delete()
          .in("id", deletedSubscriptionIds)
        if (error) throw error
      }
      for (const sub of subscriptions.filter((s) => s.id)) {
        const { error } = await supabase.from("school_subscriptions").update(sub.input).eq("id", sub.id!)
        if (error) throw error
      }
      const added = subscriptions.filter((s) => !s.id)
      if (added.length > 0) {
        const { error } = await supabase
          .from("school_subscriptions")
          .insert(added.map((s) => ({ ...s.input, student_id: studentId })))
        if (error) throw error
      }

      if (memberships.length > 0) {
        const { error } = await supabase
          .from("school_memberships")
          .upsert(
            memberships.map((m) => ({ ...m, student_id: studentId })),
            { onConflict: "student_id,season" }
          )
        if (error) throw error
      }
      return studentId
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteSchoolStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_students").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

// +1 registra un ingresso con la data di oggi, -1 toglie l'ultimo: sono
// azioni immediate (non passano dal Salva della scheda).
export function useChangeEntries() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: 1 | -1 }) => {
      const { error } =
        delta === 1
          ? await supabase.rpc("school_use_entry", { p_subscription_id: id })
          : await supabase.rpc("school_undo_entry", { p_subscription_id: id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
