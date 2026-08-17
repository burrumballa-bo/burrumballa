import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  CourseInsertInput,
  CourseLevelInsertInput,
  CourseLevelUpdateInput,
  CourseUpdateInput,
  CourseWithLevels,
} from "@/types/cms"

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async (): Promise<CourseWithLevels[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, levels:course_levels(*)")
        .order("order_index", { ascending: true })

      if (error) throw error
      return (data ?? []).map((course) => ({
        ...course,
        levels: [...(course.levels ?? [])].sort(
          (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
        ),
      }))
    },
  })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CourseInsertInput) => {
      const { error } = await supabase.from("courses").insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useUpdateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: CourseUpdateInput) => {
      const { error } = await supabase.from("courses").update(values).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useCreateCourseLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CourseLevelInsertInput) => {
      const { error } = await supabase.from("course_levels").insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useUpdateCourseLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: CourseLevelUpdateInput) => {
      const { error } = await supabase.from("course_levels").update(values).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useDeleteCourseLevel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_levels").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  })
}
