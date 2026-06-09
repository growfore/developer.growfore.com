"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { auth } from "@/lib/auth"

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

function extractTitleFromHtml(html: string): string {
  const h1 = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/i)
  if (h1) return stripHtml(h1[1]).trim()
  const text = stripHtml(html).trim()
  const firstLine = text.split("\n")[0].trim()
  return firstLine || "Untitled"
}

function extractLinksFromHtml(html: string): string[] {
  const links: string[] = []
  const aRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["']/gi
  let match
  while ((match = aRegex.exec(html)) !== null) {
    links.push(match[1])
  }
  const urlRegex = /https?:\/\/[^\s<"'>]+/gi
  while ((match = urlRegex.exec(html)) !== null) {
    const url = match[0].replace(/[.,;:!?)\]]+$/, "")
    if (!links.includes(url)) links.push(url)
  }
  return [...new Set(links)]
}

export async function createTask(prevState: unknown, formData: FormData) {
  const content = formData.get("content") as string
  const attachmentsRaw = formData.get("attachments") as string

  if (!content || typeof content !== "string") {
    return { error: "Content is required" }
  }

  const title = extractTitleFromHtml(content)
  const links = extractLinksFromHtml(content)

  let attachments: { fileName: string; fileUrl: string }[] = []
  try {
    attachments = attachmentsRaw ? JSON.parse(attachmentsRaw) : []
  } catch {}

  const session = await auth()
  const cookieStore = await cookies()
  const anonSession = cookieStore.get("anon_session")?.value

  await prisma.task.create({
    data: {
      title,
      description: content,
      links,
      attachments,
      status: "TODO",
      createdBySession: session ? null : anonSession,
    },
  })

  return { success: true }
}

export async function updateTask(prevState: unknown, formData: FormData) {
  const id = formData.get("id") as string
  const content = formData.get("content") as string
  const attachmentsRaw = formData.get("attachments") as string

  if (!id || !content) {
    return { error: "Missing required fields" }
  }

  const existing = await prisma.task.findUnique({ where: { id } })
  if (!existing) {
    return { error: "Task not found" }
  }

  const session = await auth()
  const cookieStore = await cookies()
  const anonSession = cookieStore.get("anon_session")?.value
  const canEdit = session || (existing.createdBySession && existing.createdBySession === anonSession)

  if (!canEdit) {
    return { error: "Unauthorized" }
  }

  const title = extractTitleFromHtml(content)
  const links = extractLinksFromHtml(content)

  let attachments: { fileName: string; fileUrl: string }[] = []
  try {
    attachments = attachmentsRaw ? JSON.parse(attachmentsRaw) : []
  } catch {}

  await prisma.task.update({
    where: { id },
    data: {
      title,
      description: content,
      links,
      attachments,
    },
  })

  return { success: true }
}
