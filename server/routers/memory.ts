import { z } from "zod"
import { and, desc, eq, sql } from "drizzle-orm"
import { TRPCError } from "@trpc/server"
import { router, protectedProcedure } from "../trpc"
import { db } from "@/db"
import { memories, recipes } from "@/db/schema"

const memoryInput = z.object({
  body: z.string().trim().min(1).max(5000),
  authorName: z.string().trim().min(1).max(60),
  recipeId: z.string().uuid().nullable().default(null),
})

// Memory + tagged recipe; `isMine` tells the UI whether to offer Edit.
const memoryFields = {
  id: memories.id,
  userId: memories.userId,
  authorName: memories.authorName,
  body: memories.body,
  recipeId: memories.recipeId,
  recipeTitle: recipes.title,
  recipeSlug: recipes.slug,
  createdAt: memories.createdAt,
}

export const memoryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select(memoryFields)
      .from(memories)
      .leftJoin(recipes, eq(memories.recipeId, recipes.id))
      .orderBy(desc(memories.createdAt))
    return rows.map(({ userId, ...m }) => ({ ...m, isMine: userId === ctx.session.user.id }))
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await db
        .select(memoryFields)
        .from(memories)
        .leftJoin(recipes, eq(memories.recipeId, recipes.id))
        .where(eq(memories.id, input.id))
        .limit(1)
      if (!row) return null
      const { userId, ...m } = row
      return { ...m, isMine: userId === ctx.session.user.id }
    }),

  create: protectedProcedure.input(memoryInput).mutation(async ({ ctx, input }) => {
    const [memory] = await db
      .insert(memories)
      .values({ ...input, userId: ctx.session.user.id })
      .returning({ id: memories.id })
    return memory
  }),

  // Only the author can edit their note.
  update: protectedProcedure
    .input(memoryInput.extend({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input
      const [memory] = await db
        .update(memories)
        .set({ ...fields, updatedAt: sql`now()` })
        .where(and(eq(memories.id, id), eq(memories.userId, ctx.session.user.id)))
        .returning({ id: memories.id })
      if (!memory) throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own notes." })
      return memory
    }),
})
