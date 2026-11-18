"use client"

import { useMemo, useRef, useState } from "react"
import { BookOpen, Check, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type RecipeOption = { id: string; title: string }

// Case- and accent-insensitive ("jalapeno" finds "Jalapeño").
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()

/** Searchable single-recipe picker: type to filter, tap to pick, ✕ to clear. */
export function RecipePicker({
  id,
  recipes,
  value,
  onChange,
}: {
  id?: string
  recipes: RecipeOption[]
  value: string | null
  onChange: (recipeId: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const selected = recipes.find((r) => r.id === value) ?? null

  const filtered = useMemo(() => {
    const q = fold(query.trim())
    return q ? recipes.filter((r) => fold(r.title).includes(q)) : recipes
  }, [recipes, query])

  function pick(recipe: RecipeOption) {
    onChange(recipe.id)
    setOpen(false)
    setQuery("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter" && open && filtered[highlight] && !e.nativeEvent.isComposing) {
      e.preventDefault()
      pick(filtered[highlight])
    } else if (e.key === "Escape") {
      setOpen(false)
      setQuery("")
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        {selected && !open ? (
          <BookOpen className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : (
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          autoComplete="off"
          enterKeyHint="search"
          // While searching show the query; otherwise show the picked recipe.
          value={open ? query : (selected?.title ?? "")}
          placeholder={open && selected ? selected.title : "Search recipes…"}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => {
            setOpen(true)
            setQuery("")
            setHighlight(0)
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setOpen(false)
              setQuery("")
            }, 120)
          }}
          onKeyDown={handleKeyDown}
          className="h-11 bg-background pl-9 pr-11"
        />
        {selected && !open && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Remove recipe"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          onMouseDown={(e) => {
            // keep focus so blur doesn't close before the tap registers
            e.preventDefault()
            if (blurTimer.current) clearTimeout(blurTimer.current)
          }}
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">No recipes match “{query.trim()}”</li>
          ) : (
            filtered.map((r, i) => (
              <li key={r.id} role="option" aria-selected={r.id === value}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm transition-colors",
                    i === highlight ? "bg-accent text-accent-foreground" : "text-foreground"
                  )}
                >
                  {r.title}
                  {r.id === value && <Check className="size-4 shrink-0 text-muted-foreground" />}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
