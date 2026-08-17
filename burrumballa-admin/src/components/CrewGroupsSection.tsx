import { useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CrewGroupModal } from "@/components/CrewGroupModal"
import {
  useCrewGroups,
  useCreateCrewGroup,
  useDeleteCrewGroup,
  useUpdateCrewGroup,
} from "@/hooks/useCrewGroups"
import type { CrewGroup } from "@/types/cms"

type ModalState = { mode: "create" } | { mode: "edit"; group: CrewGroup } | null

export function CrewGroupsSection() {
  const groupsQuery = useCrewGroups()
  const createGroup = useCreateCrewGroup()
  const updateGroup = useUpdateCrewGroup()
  const deleteGroup = useDeleteCrewGroup()

  const [modal, setModal] = useState<ModalState>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (groupsQuery.isLoading) {
    return <p className="text-muted-foreground text-sm">Caricamento crew...</p>
  }
  if (groupsQuery.isError) {
    return (
      <p className="text-destructive text-sm">
        Errore nel caricamento della crew: {(groupsQuery.error as Error).message}
      </p>
    )
  }

  const groups = groupsQuery.data ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Le card della sezione &quot;La crew&quot; in Chi Siamo.
        </p>
        <Button size="sm" onClick={() => setModal({ mode: "create" })}>
          <Plus />
          Nuova card
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna card ancora creata.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <div className="flex items-center gap-3">
                  {group.image_url ? (
                    <img
                      src={group.image_url}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed text-xs">
                      —
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{group.title}</div>
                    {!group.published && (
                      <div className="text-muted-foreground text-xs">Non pubblicato</div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setModal({ mode: "edit", group })}>
                  <Pencil />
                  Modifica
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modal && (
        <CrewGroupModal
          mode={modal.mode}
          group={modal.mode === "edit" ? modal.group : undefined}
          onClose={() => setModal(null)}
          onCreate={(input) =>
            createGroup.mutate(input, {
              onSuccess: () => {
                toast.success("Card creata.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Creazione non riuscita.", { description: (error as Error).message }),
            })
          }
          onSave={(input) =>
            updateGroup.mutate(input, {
              onSuccess: () => {
                toast.success("Card salvata.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Salvataggio non riuscito.", { description: (error as Error).message }),
            })
          }
          onDelete={(id) => {
            setDeletingId(id)
            deleteGroup.mutate(id, {
              onSuccess: () => {
                toast.success("Card eliminata.")
                setModal(null)
              },
              onError: (error) =>
                toast.error("Eliminazione non riuscita.", { description: (error as Error).message }),
              onSettled: () => setDeletingId(null),
            })
          }}
          isSaving={createGroup.isPending || updateGroup.isPending}
          isDeleting={deleteGroup.isPending && modal.mode === "edit" && deletingId === modal.group.id}
        />
      )}
    </div>
  )
}
