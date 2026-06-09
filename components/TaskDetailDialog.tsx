"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import type { Task } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, File, Pencil } from "lucide-react"
import EditTaskDialog from "./EditTaskDialog"

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)$/i.test(url)
}

function getAnonSession(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)anon_session=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: () => void
}) {
  const { data: session } = useSession()
  const [editOpen, setEditOpen] = useState(false)
  const attachments = (task.attachments as { fileName: string; fileUrl: string }[]) ?? []
  const links = task.links ?? []

  const anonSession = getAnonSession()
  const canEdit = !!session || (!!anonSession && anonSession === task.createdBySession)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{task.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {task.description && (
              <div
                className="prose prose-sm max-w-none text-foreground [&_a]:text-link [&_a]:underline [&_img]:max-w-full [&_img]:rounded-md"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            )}

            {links.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">Links</p>
                <div className="flex flex-wrap gap-1.5">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span>{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-foreground">
                  Attachments ({attachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a, i) => {
                    const isImage = isImageUrl(a.fileUrl) || isImageUrl(a.fileName)
                    if (isImage) {
                      return (
                        <a
                          key={i}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-lg overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.fileUrl}
                            alt={a.fileName}
                            className="size-24 object-cover rounded-lg border border-border"
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
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-link hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <File className="size-3.5" aria-hidden="true" />
                        <span>{a.fileName}</span>
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5 mr-1" aria-hidden="true" />
                Edit
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <EditTaskDialog
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
        onTaskUpdated={onTaskUpdated}
      />
    </>
  )
}
