import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  SchoolStudent,
  SchoolStudentSaveInput,
  SchoolSubscription,
  SubscriptionInput,
} from "@/types/school"

const KEY = ["school-students"]

export function useSchoolStudents() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<SchoolStudent[]> => {
      const { data, error } = await supabase
        .from("school_students")
        .select("*, classes:school_student_classes(course_level_id), subscriptions:school_subscriptions(*)")
        .order("last_name", { ascending: true })

      if (error) throw error
      return (data ?? []).map(({ classes, subscriptions, ...student }) => ({
        ...student,
        classIds: (classes ?? []).map((c: { course_level_id: string }) => c.course_level_id),
        subscriptions: (subscriptions ?? [])
          .map((s: SchoolSubscription) => ({ ...s, price: Number(s.price) }))
          .sort((a: SchoolSubscription, b: SchoolSubscription) =>
            b.start_date.localeCompare(a.start_date)
          ),
      }))
    },
  })
}

// Salva anagrafica + classi (riallineate con delete + insert) e, per i nuovi iscritti, gli abbonamenti.
export function useSaveSchoolStudent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, student, classIds, subscriptions }: SchoolStudentSaveInput) => {
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

      // Gli abbonamenti di un iscritto esistente sono salvati subito dalla modale;
      // qui vengono inseriti solo quelli di un iscritto appena creato.
      if (!id && subscriptions.length > 0) {
        const { error } = await supabase
          .from("school_subscriptions")
          .insert(subscriptions.map((s) => ({ ...s, student_id: studentId })))
        if (error) throw error
      }
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

export function useUpdateEntriesUsed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, entries_used }: { id: string; entries_used: number }) => {
      const { error } = await supabase
        .from("school_subscriptions")
        .update({ entries_used })
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

// Insert (senza id) o update (con id) di un singolo abbonamento; restituisce l'id.
export function useSaveSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      studentId,
      id,
      input,
    }: {
      studentId: string
      id?: string
      input: SubscriptionInput
    }): Promise<string> => {
      if (id) {
        const { error } = await supabase.from("school_subscriptions").update(input).eq("id", id)
        if (error) throw error
        return id
      }
      const { data, error } = await supabase
        .from("school_subscriptions")
        .insert({ ...input, student_id: studentId })
        .select("id")
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("school_subscriptions").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
