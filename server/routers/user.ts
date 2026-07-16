import { z } from "zod"
import { asc, eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { TRPCError } from "@trpc/server"
import { router, publicProcedure, adminProcedure } from "../trpc"
import { db } from "@/db"
import { users } from "@/db/schema"

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export const userRouter = router({
  list: adminProcedure.query(async () => {
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        createdAt: users.createdAt,
        lastActiveAt: users.lastActiveAt,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .orderBy(asc(users.username))

    return rows.map(({ passwordHash, ...row }) => ({
      ...row,
      hasPassword: passwordHash !== null,
    }))
  }),

  create: adminProcedure
    .input(
      z.object({
        username: z.string().trim().min(2).max(32),
        role: z.enum(["admin", "member"]).default("member"),
      })
    )
    .mutation(async ({ input }) => {
      const username = normalizeUsername(input.username)

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1)
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That username is already taken.",
        })
      }

      const [user] = await db
        .insert(users)
        .values({ username, role: input.role })
        .returning()
      return user
    }),

  needsSetup: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const username = normalizeUsername(input.username)
      const [user] = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.username, username))
        .limit(1)

      if (!user) return { exists: false, needsSetup: false }
      return { exists: true, needsSetup: user.passwordHash === null }
    }),

  claim: publicProcedure
    .input(
      z.object({
        username: z.string().trim().min(1),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      const username = normalizeUsername(input.username)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1)

      if (!user || user.passwordHash !== null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This account can't be claimed.",
        })
      }

      const passwordHash = await bcrypt.hash(input.password, 10)
      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, user.id))

      return { username }
    }),
})
