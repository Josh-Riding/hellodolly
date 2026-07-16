import { z } from "zod"
import { asc, eq, sql } from "drizzle-orm"
import { router, protectedProcedure } from "../trpc"
import { db } from "@/db"
import { recipes } from "@/db/schema"

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const createInput = z.object({
  title: z.string().min(1),
  category: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  ingredients: z
    .array(z.object({
      name: z.string().default(""),
      items: z.array(z.object({ amount: z.string(), ingredient: z.string() })).default([]),
    }))
    .default([]),
  steps: z.array(z.string()).default([]),
  source: z.enum(["manual"]).default("manual"),
})

export const recipeRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(recipes).orderBy(asc(recipes.title))
  }),

  get: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [recipe] = await db
        .select()
        .from(recipes)
        .where(eq(recipes.slug, input.slug))
        .limit(1)
      return recipe ?? null
    }),

  create: protectedProcedure.input(createInput).mutation(async ({ input }) => {
    const baseSlug = slugify(input.title)
    // ensure uniqueness by appending timestamp if needed
    const existing = await db
      .select({ slug: recipes.slug })
      .from(recipes)
      .where(eq(recipes.slug, baseSlug))
      .limit(1)
    const slug =
      existing.length > 0 ? `${baseSlug}-${Date.now()}` : baseSlug

    const [recipe] = await db
      .insert(recipes)
      .values({
        title: input.title,
        slug,
        category: input.category,
        tags: input.tags,
        ingredients: input.ingredients,
        steps: input.steps,
        source: input.source,
      })
      .returning()

    return recipe
  }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1),
      category: z.string().nullable().default(null),
      tags: z.array(z.string()).default([]),
      ingredients: z
        .array(z.object({
          name: z.string().default(""),
          items: z.array(z.object({ amount: z.string(), ingredient: z.string() })).default([]),
        }))
        .default([]),
      steps: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input }) => {
      const [recipe] = await db
        .update(recipes)
        .set({
          title: input.title,
          category: input.category,
          tags: input.tags,
          ingredients: input.ingredients,
          steps: input.steps,
          updatedAt: sql`now()`,
        })
        .where(eq(recipes.id, input.id))
        .returning()

      return recipe
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      await db.delete(recipes).where(eq(recipes.id, input.id))
      return { id: input.id }
    }),

  tagList: protectedProcedure.query(async () => {
    const rows = await db.execute(
      sql`SELECT DISTINCT unnest(tags) AS tag FROM recipes ORDER BY tag`
    )
    return (rows as unknown as { tag: string }[]).map((r) => r.tag)
  }),
})
