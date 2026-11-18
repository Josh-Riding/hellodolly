import type { IngredientGroup } from "@/db/schema"

// Unit spellings collapsed to one canonical form. Matched as whole words, case-insensitive.
const UNIT_ALIASES: [RegExp, string][] = [
  [/\b(teaspoons?|tsps?)\b\.?/gi, "tsp"],
  [/\b(tablespoons?|tbsps?|tbs)\b\.?/gi, "tbsp"],
  [/\b(ounces?|ozs?)\b\.?/gi, "oz"],
  [/\b(pounds?|lbs?)\b\.?/gi, "lb"],
]

// Section names that say nothing ("Ingredients" under the Ingredients heading).
const MEANINGLESS_GROUP_NAMES = new Set(["ingredients", "ingredient"])

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim()
}

export function normalizeAmount(amount: string): string {
  let out = clean(amount)
  for (const [pattern, unit] of UNIT_ALIASES) out = out.replace(pattern, unit)
  return out
}

type RecipeFields = {
  title: string
  tags: string[]
  ingredients: IngredientGroup[]
  steps: string[]
}

export function cleanRecipe<T extends RecipeFields>(input: T): T {
  const ingredients = input.ingredients
    .map((group) => {
      const name = clean(group.name)
      return {
        name: MEANINGLESS_GROUP_NAMES.has(name.toLowerCase()) ? "" : name,
        items: group.items
          .map((item) => ({
            amount: normalizeAmount(item.amount),
            ingredient: clean(item.ingredient),
          }))
          .filter((item) => item.amount || item.ingredient),
      }
    })
    .filter((group) => group.items.length > 0)

  return {
    ...input,
    title: clean(input.title),
    tags: input.tags.map(clean).filter(Boolean),
    ingredients,
    steps: input.steps.map((s) => s.trim()).filter(Boolean),
  }
}
