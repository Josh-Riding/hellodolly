import { describe, it, expect } from "vitest"
import { MEAL_CATEGORIES, TAG_TO_CATEGORY } from "../categories"

describe("MEAL_CATEGORIES", () => {
  it("contains the expected pill labels", () => {
    expect(MEAL_CATEGORIES).toContain("Meal")
    expect(MEAL_CATEGORIES).toContain("Dessert")
    expect(MEAL_CATEGORIES).toContain("Appetizer")
    expect(MEAL_CATEGORIES).not.toContain("Breakfast")
    expect(MEAL_CATEGORIES).not.toContain("Lunch")
    expect(MEAL_CATEGORIES).not.toContain("Dinner")
  })
})

describe("TAG_TO_CATEGORY (voice parser normalization)", () => {
  it("maps 'meal' to Meal", () => {
    expect(TAG_TO_CATEGORY["meal"]).toBe("Meal")
  })

  it("maps 'dinner' to Meal", () => {
    expect(TAG_TO_CATEGORY["dinner"]).toBe("Meal")
  })

  it("maps 'lunch' to Meal", () => {
    expect(TAG_TO_CATEGORY["lunch"]).toBe("Meal")
  })

  it("maps 'breakfast' to Meal", () => {
    expect(TAG_TO_CATEGORY["breakfast"]).toBe("Meal")
  })

  it("maps other categories to themselves", () => {
    expect(TAG_TO_CATEGORY["dessert"]).toBe("Dessert")
    expect(TAG_TO_CATEGORY["snack"]).toBe("Snack")
    expect(TAG_TO_CATEGORY["soup"]).toBe("Soup")
  })

  it("does not map free-form tags", () => {
    expect(TAG_TO_CATEGORY["italian"]).toBeUndefined()
    expect(TAG_TO_CATEGORY["spicy"]).toBeUndefined()
  })
})
