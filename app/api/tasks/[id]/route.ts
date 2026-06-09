import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { status } = body

  if (!["BACKLOG", "TODO", "IN_PROGRESS", "DONE"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const session = await auth()
  const anonSession = request.cookies.get("anon_session")?.value

  if (session) {
    const task = await prisma.task.update({
      where: { id },
      data: { status },
    })
    return NextResponse.json(task)
  }

  if (anonSession) {
    const existing = await prisma.task.findUnique({ where: { id } })
    if (existing && existing.createdBySession === anonSession) {
      const task = await prisma.task.update({
        where: { id },
        data: { status },
      })
      return NextResponse.json(task)
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
