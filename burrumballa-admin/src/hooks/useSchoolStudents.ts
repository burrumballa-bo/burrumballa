import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { SchoolStudent, SchoolStudentSaveInput } from "@/types/school"

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
        subscriptions: [...(subscriptions ?? [])].sort((a, b) =>
          a.start_date.localeCompare(b.start_date)
        ),
      }))
    },
  })
}

// Salva anagrafica + classi + abbonamenti in sequenza. Classi e abbonamenti
// vengono riallineati (delete + insert) rispetto allo stato del modale.
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

      const delSubs = await supabase
        .from("school_subscriptions")
        .delete()
        .eq("student_id", studentId)
      if (delSubs.error) throw delSubs.error
      if (subscriptions.length > 0) {
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
