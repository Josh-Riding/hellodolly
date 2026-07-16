export const MEAL_CATEGORIES = [
  "Meal",
  "Dessert",
  "Appetizer",
  "Snack",
  "Salad",
  "Soup",
  "Side",
  "Bread",
  "Drink",
] as const

export type MealCategory = typeof MEAL_CATEGORIES[number]

export const TAG_TO_CATEGORY: Record<string, MealCategory> = {
  breakfast: "Meal",
  lunch:     "Meal",
  dinner:    "Meal",
  meal:      "Meal",
  dessert:   "Dessert",
  appetizer: "Appetizer",
  snack:     "Snack",
  salad:     "Salad",
  soup:      "Soup",
  side:      "Side",
  bread:     "Bread",
  drink:     "Drink",
}

