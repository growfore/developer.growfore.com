import { prisma } from "@/lib/prisma"
import BoardPage from "@/components/BoardPage"
import type { Task } from "@/lib/types"

export default async function Home() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
  })
  return <BoardPage initialTasks={tasks as unknown as Task[]} />
}
