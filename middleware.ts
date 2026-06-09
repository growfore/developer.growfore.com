import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  if (!request.cookies.has("anon_session")) {
    const sessionId = crypto.randomUUID()
    response.cookies.set("anon_session", sessionId, {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    })
  }
  return response
}

export const config = {
  matcher: "/((?!_next|favicon|icon).*)",
}
