"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import KanbanColumn from "./KanbanColumn"
import type { Task, TaskStatus } from "@/lib/types"

const COLUMNS = [
  { key: "BACKLOG" as TaskStatus, label: "Backlog" },
  { key: "TODO" as TaskStatus, label: "To Do" },
  { key: "IN_PROGRESS" as TaskStatus, label: "In Progress" },
  { key: "DONE" as TaskStatus, label: "Finished" },
]

export default function KanbanBoard({
  tasks,
  setTasks,
  onTaskUpdated,
}: {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  onTaskUpdated?: () => void
}) {
  const { data: session } = useSession()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  async function handleMoveTask(taskId: string, newStatus: TaskStatus) {
    if (!session) {
      toast.error("Sign in to move tasks")
      return
    }

    const prevTask = tasks.find((t) => t.id === taskId)

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t
      )
    )

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok && prevTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? prevTask : t))
        )
        if (res.status === 401) {
          toast.error("Session expired \u2014 sign in again")
        }
      }
    } catch {
      if (prevTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? prevTask : t))
        )
      }
      toast.error("Failed to move task")
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return

    const ids = Array.from(selectedIds)
    const confirmed = window.confirm(
      `Delete ${ids.length} task${ids.length === 1 ? "" : "s"}?`
    )
    if (!confirmed) return

    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => !selectedIds.has(t.id)))
        clearSelection()
        toast.success(`Deleted ${ids.length} task${ids.length === 1 ? "" : "s"}`)
      } else if (res.status === 401) {
        toast.error("Session expired \u2014 sign in again")
      }
    } catch {
      toast.error("Failed to delete tasks")
    }
  }

  return (
    <>
      <div className="flex gap-4 min-h-[calc(100vh-12rem)]">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            title={col.label}
            status={col.key}
            tasks={tasks.filter((t) => t.status === col.key)}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            session={!!session}
            onMoveTask={handleMoveTask}
            onTaskUpdated={onTaskUpdated}
          />
        ))}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm shadow-lg">
            <span className="text-muted-foreground">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="size-3.5 mr-1" aria-hidden="true" />
              Delete
            </Button>
            <button
              type="button"
              onClick={clearSelection}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
              aria-label="Clear selection"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
