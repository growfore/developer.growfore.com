"use client"

import { useState, useActionState, useEffect } from "react"
import { toast } from "sonner"
import { Paperclip, X, File } from "lucide-react"

function isImageUrl(url: string) {
  return /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)$/i.test(url)
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import TiptapEditor from "./TiptapEditor"
import { createTask } from "@/app/actions"

interface Attachment {
  fileName: string
  fileUrl: string
}

export default function TaskDialog({
  children,
  onTaskCreated,
}: {
  children: React.ReactNode
  onTaskCreated?: () => void
}) {
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(createTask, null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Task submitted!")
      onTaskCreated?.()
      /* eslint-disable react-hooks/set-state-in-effect */
      setContent("")
      setAttachments([])
      setOpen(false)
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state, onTaskCreated])

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploaded: Attachment[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset!)

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          { method: "POST", body: formData }
        )
        const data = await res.json()
        if (data.secure_url) {
          uploaded.push({ fileName: file.name, fileUrl: data.secure_url })
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }

    setAttachments((prev) => [...prev, ...uploaded])
    setUploading(false)
    e.target.value = ""
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const isEmpty = !content || content === "<p></p>"
    if (isEmpty) {
      e.preventDefault()
      toast.error("Please enter task details")
      return
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="content" value={content} readOnly />
          <input
            type="hidden"
            name="attachments"
            value={JSON.stringify(attachments)}
            readOnly
          />

          <div>
            <label
              htmlFor="tiptap-editor"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Task details
            </label>
            <div
              id="tiptap-editor"
              role="textbox"
              aria-multiline="true"
              aria-label="Task details editor"
            >
              <TiptapEditor
                content={content}
                onChange={setContent}
                onImageUploaded={(url, name) =>
                  setAttachments((prev) => [...prev, { fileName: name, fileUrl: url }])
                }
              />
            </div>
          </div>

          <div>
            <p
              id="attachments-label"
              className="mb-1.5 block text-xs font-medium text-foreground"
            >
              Attachments
            </p>

            <label
              htmlFor="file-upload"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              style={{ touchAction: "manipulation" }}
            >
              <Paperclip className="size-4" aria-hidden="true" />
              <span>{uploading ? "Uploading\u2026" : "Attach files"}</span>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                name="file"
                aria-labelledby="attachments-label"
              />
            </label>

            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1" aria-live="polite">
                {attachments.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 rounded-sm bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    {isImageUrl(a.fileUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.fileUrl}
                        alt=""
                        className="size-8 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <File className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="truncate">{a.fileName}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="ml-auto rounded-sm p-0.5 text-muted-foreground hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      aria-label={`Remove ${a.fileName}`}
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || uploading}>
              {pending ? "Submitting\u2026" : "Submit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
