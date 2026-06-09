import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

export async function GET() {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content, attachments } = body

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const title = extractTitleFromHtml(content)
  const links = extractLinksFromHtml(content)

  const session = await auth()
  const anonSession = request.cookies.get("anon_session")?.value

  const task = await prisma.task.create({
    data: {
      title,
      description: content,
      links,
      attachments: Array.isArray(attachments) ? attachments : [],
      status: "TODO",
      createdBySession: session ? null : anonSession,
    },
  })

  return NextResponse.json(task, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { ids } = body
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 })
  }

  const session = await auth()
  const anonSession = request.cookies.get("anon_session")?.value

  if (session) {
    const result = await prisma.task.deleteMany({ where: { id: { in: ids } } })
    return NextResponse.json({ deleted: result.count })
  }

  if (anonSession) {
    const result = await prisma.task.deleteMany({
      where: { id: { in: ids }, createdBySession: anonSession },
    })
    return NextResponse.json({ deleted: result.count })
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
