"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Loader2,
} from "lucide-react"
import { useCallback, useState } from "react"

interface ToolBtnProps {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}

function ToolBtn({ active, onClick, label, children }: ToolBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`rounded-sm p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  )
}

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  onImageUploaded?: (url: string, name: string) => void
}

export default function TiptapEditor({ content, onChange, onImageUploaded }: TiptapEditorProps) {
  const [pasting, setPasting] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-link underline" },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          width: 200,
          height: 200,
          style: "object-fit: contain; border-radius: 6px;",
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[180px] px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-b-lg [&_img]:rounded-md [&_img]:my-1 caret-[#11B5FF]",
        "aria-label": "Task description editor",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (!file) continue
            event.preventDefault()
            uploadAndInsert(file)
            return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    immediatelyRender: false,
  })

  async function uploadAndInsert(file: File) {
    setPasting(true)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !uploadPreset) {
      setPasting(false)
      return
    }

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData }
      )
      const data = await res.json()
      if (data.secure_url) {
        onImageUploaded?.(data.secure_url, file.name)
      }
    } catch {
      /* silently fail */
    } finally {
      setPasting(false)
    }
  }

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run()
  }, [editor])

  if (!editor) return null

  return (
    <div
      className="rounded-lg border border-input bg-background"
      style={{ touchAction: "manipulation" }}
    >
      <div className="flex items-center gap-0.5 border-b border-input px-2 py-1.5">
        {pasting && (
          <Loader2 className="mr-1 size-3 animate-spin text-muted-foreground" aria-hidden="true" />
        )}
        <ToolBtn
          active={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          label="Heading 1"
        >
          <Heading1 className="size-4" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          label="Heading 2"
        >
          <Heading2 className="size-4" aria-hidden="true" />
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-border" role="separator" />
        <ToolBtn
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="size-4" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="size-4" aria-hidden="true" />
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-border" role="separator" />
        <ToolBtn
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List className="size-4" aria-hidden="true" />
        </ToolBtn>
        <ToolBtn
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Ordered list"
        >
          <ListOrdered className="size-4" aria-hidden="true" />
        </ToolBtn>
        <span className="mx-1 h-4 w-px bg-border" role="separator" />
        <ToolBtn
          active={editor.isActive("link")}
          onClick={setLink}
          label="Insert link"
        >
          <LinkIcon className="size-4" aria-hidden="true" />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
