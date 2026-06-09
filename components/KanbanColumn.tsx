"use client"

import { useRef } from "react"
import type { Task, TaskStatus } from "@/lib/types"
import { draggedTaskId } from "@/lib/drag-store"
import TaskCard from "./TaskCard"

const DRAG_CLASS = "border-foreground bg-muted"

interface KanbanColumnProps {
  title: string
  status: TaskStatus
  tasks: Task[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  session: boolean
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void
  onTaskUpdated?: () => void
}

export default function KanbanColumn({
  title,
  status,
  tasks,
  selectedIds,
  onToggleSelect,
  session,
  onMoveTask,
  onTaskUpdated,
}: KanbanColumnProps) {
  const ref = useRef<HTMLDivElement>(null)

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  function handleDragEnter() {
    ref.current?.classList.add(...DRAG_CLASS.split(" "))
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!ref.current?.contains(e.relatedTarget as Node)) {
      ref.current?.classList.remove(...DRAG_CLASS.split(" "))
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    ref.current?.classList.remove(...DRAG_CLASS.split(" "))
    const id = draggedTaskId
    console.log("KanbanColumn drop", { status, id })
    if (id) {
      onMoveTask(id, status)
    }
  }

  return (
    <div
      ref={ref}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex min-h-[300px] w-[280px] shrink-0 flex-col rounded-xl border border-border bg-card p-4 transition-colors"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            selected={selectedIds.has(task.id)}
            onToggleSelect={onToggleSelect}
            showCheckbox={session}
            onTaskUpdated={onTaskUpdated}
          />
        ))}
        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No tasks
          </p>
        )}
      </div>
    </div>
  )
}
