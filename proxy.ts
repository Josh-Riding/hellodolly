import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { sql } from "drizzle-orm"

const PUBLIC_PATHS = ["/login"]

async function touchLastActive(userId: string) {
  await db
    .update(users)
    .set({ lastActiveAt: sql`now()` })
    .where(
      sql`${users.id} = ${userId} AND (${users.lastActiveAt} IS NULL OR ${users.lastActiveAt}::date < CURRENT_DATE)`
    )
}

export default auth((req) => {
  const { pathname } = req.nextUrl

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const isAuthRoute = pathname.startsWith("/api/auth")
  // tRPC has its own public/protected/admin procedures (server/trpc.ts) — that's
  // the real enforcement layer. The login page also needs to call public
  // procedures (user.needsSetup, user.claim) before a session exists.
  const isTrpcRoute = pathname.startsWith("/api/trpc")

  if (isPublic || isAuthRoute || isTrpcRoute) {
    return NextResponse.next()
  }

  if (!req.auth) {
    const url = new URL("/login", req.nextUrl)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith("/admin") && req.auth.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  if (req.auth.user?.id) {
    // Fire-and-forget; the conditional UPDATE self-throttles to once/day.
    void touchLastActive(req.auth.user.id)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
}
