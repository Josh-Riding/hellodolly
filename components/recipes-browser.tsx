"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ChefHat, Search } from "lucide-react"
import type { Recipe } from "@/db/schema"
const CATEGORIES = [
  "All",
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

type ActiveCategory = (typeof CATEGORIES)[number]

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")


export function RecipesBrowser({ recipes }: { recipes: Recipe[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("All")
  const [activeKitchen, setActiveKitchen] = useState<string | null>(null)

  const kitchens = useMemo(
    () =>
      Array.from(new Set(recipes.map((r) => r.kitchen).filter((k): k is string => !!k)))
        .sort((a, b) => a.localeCompare(b)),
    [recipes]
  )

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return recipes.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(q) ||
        (r.kitchen?.toLowerCase().includes(q) ?? false)
      const categoryMatch =
        activeCategory === "All" || r.category === activeCategory
      const kitchenMatch = activeKitchen === null || r.kitchen === activeKitchen
      return matchesSearch && categoryMatch && kitchenMatch
    })
  }, [recipes, searchQuery, activeCategory, activeKitchen])

  const grouped = useMemo(() => {
    const map = new Map<string, Recipe[]>()
    const sorted = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
    for (const recipe of sorted) {
      const letter = recipe.title[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(recipe)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const activeLetters = useMemo(
    () => new Set(grouped.map(([letter]) => letter)),
    [grouped]
  )

  function scrollToLetter(letter: string) {
    document.getElementById(`section-${letter}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <div className="relative flex gap-6">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search recipes or kitchens…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}>
              <Badge
                variant={activeCategory === cat ? "default" : "outline"}
                className="cursor-pointer select-none transition-colors"
              >
                {cat}
              </Badge>
            </button>
          ))}
        </div>

        {/* Kitchen pills */}
        {kitchens.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <ChefHat className="size-4 text-muted-foreground" aria-label="Kitchens" />
            {[null, ...kitchens].map((k) => (
              <button key={k ?? "all"} onClick={() => setActiveKitchen(k)}>
                <Badge
                  variant={activeKitchen === k ? "default" : "outline"}
                  className="cursor-pointer select-none transition-colors"
                >
                  {k ?? "All kitchens"}
                </Badge>
              </button>
            ))}
          </div>
        )}

        {/* Recipe list */}
        {grouped.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No recipes found.
          </p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([letter, letterRecipes]) => (
              <section key={letter}>
                <div
                  id={`section-${letter}`}
                  className="mb-3 flex scroll-mt-6 items-center gap-4"
                >
                  <span className="text-4xl font-bold leading-none text-muted-foreground/25">
                    {letter}
                  </span>
                  <Separator className="flex-1" />
                </div>

                <ul className="space-y-1">
                  {letterRecipes.map((recipe) => (
                    <li key={recipe.slug}>
                      <a
                        href={`/recipe/${recipe.slug}`}
                        className="group flex items-center justify-between rounded-md px-1 py-1.5 text-sm transition-colors hover:text-primary"
                      >
                        <span className="underline-offset-4 group-hover:underline">
                          {recipe.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {recipe.kitchen && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <ChefHat className="size-3" />
                              {recipe.kitchen}
                            </span>
                          )}
                          {recipe.category && (
                            <Badge variant="ghost" className="text-xs">
                              {recipe.category}
                            </Badge>
                          )}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* A–Z sidebar */}
      <nav className="sticky top-8 flex w-5 shrink-0 flex-col items-center gap-0.5 self-start">
        {ALPHABET.map((letter) => {
          const active = activeLetters.has(letter)
          return (
            <button
              key={letter}
              onClick={() => scrollToLetter(letter)}
              disabled={!active}
              className={[
                "flex size-5 items-center justify-center rounded text-xs font-medium leading-none transition-colors",
                active
                  ? "text-foreground hover:text-primary"
                  : "cursor-default text-muted-foreground/30",
              ].join(" ")}
              aria-label={`Jump to ${letter}`}
            >
              {letter}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
