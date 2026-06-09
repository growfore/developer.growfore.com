"use client"

import { useActionState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()

  async function submit(prevState: unknown, formData: FormData) {
    const password = formData.get("password") as string
    const result = await signIn("credentials", {
      password,
      redirect: false,
    })

    if (result?.ok) {
      router.push("/")
      return { success: true }
    }
    return { error: "Invalid password" }
  }

  const [state, formAction, pending] = useActionState(submit, null)

  useEffect(() => {
    if (state?.error) {
      const el = document.getElementById("password-error")
      if (el) el.hidden = false
    }
  }, [state])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter the admin password to move tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                autoFocus
              />
              <p
                id="password-error"
                hidden
                className="mt-1 text-xs text-destructive"
                role="alert"
              >
                {state?.error}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in\u2026" : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
