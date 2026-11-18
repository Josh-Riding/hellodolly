import type { Ingredient } from "@/db/schema"

// Leading list markers: bullets, checkboxes, "1." / "2)" numbering, "Step 3:".
// Numbering needs whitespace after it so "1.5 cups" isn't mistaken for "1.".
const LIST_MARKER = /^\s*(?:[-*•·▪◦▢□☐]\s*|\d+[.)]\s+|step\s*\d+\s*[:.)-]?\s*)/i

// Section headings copied along with a recipe ("Ingredients:", "Directions").
const HEADING = /^(?:ingredients|instructions|directions|method|steps|preparation)\s*:?$/i

/** Split pasted text into trimmed, non-empty lines with list markers and headings removed. */
export function splitPastedLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(LIST_MARKER, "").trim())
    .filter((line) => line && !HEADING.test(line))
}

const FRACTIONS = "½⅓⅔¼¾⅛⅜⅝⅞"
const NUM = `(?:\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+\\s*[${FRACTIONS}]|[${FRACTIONS}]|\\d+(?:\\.\\d+)?)`
const QTY = `${NUM}(?:\\s*(?:-|–|to)\\s*${NUM})?`
const UNITS = [
  "cups?", "tablespoons?", "tbsps?", "tbs", "teaspoons?", "tsps?",
  "fl\\.?\\s*oz", "ounces?", "oz", "pounds?", "lbs?",
  "grams?", "g", "kilograms?", "kg", "milliliters?", "ml", "liters?", "litres?", "l",
  "quarts?", "qts?", "pints?", "pts?", "gallons?",
  "cloves?", "cans?", "packages?", "pkgs?", "sticks?", "slices?", "jars?", "bottles?",
  "pinch(?:es)?", "dash(?:es)?", "bunch(?:es)?", "heads?", "sprigs?", "handfuls?",
]
// quantity, optional "(14 oz)", optional unit — the rest is the ingredient.
const INGREDIENT_LINE = new RegExp(
  `^(${QTY}(?:\\s*\\([^)]*\\))?(?:\\s+(?:${UNITS.join("|")})(?![a-z])\\.?)?)\\s+(?:of\\s+)?(.+)$`,
  "i"
)

/** "1 1/2 cups flour" → { amount: "1 1/2 cups", ingredient: "flour" }. No leading quantity → all ingredient. */
export function parseIngredientLine(line: string): Ingredient {
  const m = line.match(INGREDIENT_LINE)
  if (!m) return { amount: "", ingredient: line }
  return { amount: m[1].trim(), ingredient: m[2].trim() }
}
