import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core"

export type Ingredient = { amount: string; ingredient: string }
export type IngredientGroup = { name: string; items: Ingredient[] }

export const userRoleEnum = pgEnum("user_role", ["admin", "member"])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("member"),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const recipes = pgTable("recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category"),
  kitchen: text("kitchen"),
  tags: text("tags").array().notNull().default([]),
  ingredients: jsonb("ingredients")
    .$type<IngredientGroup[]>()
    .notNull()
    .default([]),
  steps: jsonb("steps").$type<string[]>().notNull().default([]),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipeId: uuid("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.recipeId] })]
)
