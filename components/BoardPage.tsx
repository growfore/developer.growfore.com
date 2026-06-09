"use client";

import { useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import KanbanBoard from "@/components/KanbanBoard";
import TaskDialog from "@/components/TaskDialog";
import type { Task } from "@/lib/types";

export default function BoardPage({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const { data: session } = useSession();

  const refreshTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) setTasks(await res.json());
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Developer Tasks
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {session
              ? "Drag tasks between columns to update status"
              : "Sign in to move tasks"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          ) : (
            <Link
              href="/login"
              className="text-sm text-link underline underline-offset-4 hover:text-link/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm"
            >
              Sign in
            </Link>
          )}
          <TaskDialog onTaskCreated={refreshTasks}>
            <Button>
              <Plus className="size-4" aria-hidden="true" />
              New task
            </Button>
          </TaskDialog>
        </div>
      </div>
      <KanbanBoard tasks={tasks} setTasks={setTasks} onTaskUpdated={refreshTasks} />
    </div>
  );
}
