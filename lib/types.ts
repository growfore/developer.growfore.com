export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE"

export interface Attachment {
  fileName: string
  fileUrl: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  links: string[]
  attachments: Attachment[] | string
  status: TaskStatus
  createdBySession: string | null
  createdAt: string
}
