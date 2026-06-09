"use client"

import { useState, useRef, type DragEvent } from "react"
import type { Task } from "@/lib/types"
import { GripVertical, ExternalLink, File, Check } from "lucide-react"

import { setDraggedTaskId } from "@/lib/drag-store"
import TaskDetailDialog from "./TaskDetailDialog"

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)$/i.test(url)
}

interface TaskCardProps {
  task: Task
  selected?: boolean
  onToggleSelect?: (id: string) => void
  showCheckbox?: boolean
  onTaskUpdated?: () => void
}

export default function TaskCard({
  task,
  selected = false,
  onToggleSelect,
  showCheckbox = false,
  onTaskUpdated,
}: TaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const dragging = useRef(false)

  function handleDragStart(e: DragEvent<HTMLDivElement>) {
    dragging.current = true
    setDraggedTaskId(task.id)
    e.dataTransfer.effectAllowed = "move"
  }

  function handleDragEnd() {
    setDraggedTaskId(null)
    // delay reset so click handler can check
    setTimeout(() => { dragging.current = false }, 0)
  }

  const attachments = (task.attachments as { fileName: string; fileUrl: string }[]) ?? []
  const links = task.links ?? []

  function handleClick() {
    if (dragging.current) return
    setDetailOpen(true)
  }

  return (
    <>
      <div
        draggable={showCheckbox}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={`rounded-xl border p-4 text-sm shadow-sm transition-shadow hover:shadow-md ${
          selected
            ? "border-foreground bg-accent"
            : "border-border bg-card"
        } ${showCheckbox ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
      >
        <div className="flex items-start gap-2">
          {showCheckbox && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleSelect?.(task.id) }}
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-muted"
              }`}
              aria-label={selected ? `Deselect ${task.title}` : `Select ${task.title}`}
            >
              {selected && <Check className="size-3" aria-hidden="true" />}
            </button>
          )}

          {showCheckbox && (
            <span className="mt-0.5 text-muted-foreground">
              <GripVertical className="size-3.5" aria-hidden="true" />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium text-foreground">{task.title}</h3>

            {task.description && (
              <div
                className="prose prose-sm mt-1 max-w-none text-xs text-muted-foreground [&_a]:text-link [&_a]:underline line-clamp-3"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            )}

            {links.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {links.map((link, i) => {
                  try {
                    return (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
                      >
                        <ExternalLink className="size-3" aria-hidden="true" />
                        <span className="truncate max-w-[120px]">
                          {new URL(link).hostname}
                        </span>
                      </a>
                    )
                  } catch {
                    return null
                  }
                })}
              </div>
            )}

            {attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {attachments.map((a, i) => {
                  const isImage = isImageUrl(a.fileUrl) || isImageUrl(a.fileName)
                  if (isImage) {
                    return (
                      <a
                        key={i}
                        href={a.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg overflow-hidden"
                        aria-label={a.fileName}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.fileUrl}
                          alt={a.fileName}
                          className="size-16 object-cover rounded-lg border border-border"
                          loading="lazy"
                        />
                      </a>
                    )
                  }
                  return (
                    <a
                      key={i}
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
                    >
                      <File className="size-3" aria-hidden="true" />
                      <span className="truncate max-w-[120px]">{a.fileName}</span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskDetailDialog
        task={task}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdated={onTaskUpdated}
      />
    </>
  )
}
