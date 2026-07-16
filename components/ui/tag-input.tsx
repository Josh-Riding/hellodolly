"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
}

function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Add a tag…",
  className,
}: TagInputProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [highlight, setHighlight] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const blurTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const selectedLower = React.useMemo(
    () => new Set(value.map((t) => t.toLowerCase())),
    [value]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return suggestions.filter(
      (s) => !selectedLower.has(s.toLowerCase()) && s.toLowerCase().includes(q)
    )
  }, [suggestions, selectedLower, query])

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || selectedLower.has(tag.toLowerCase())) {
      setQuery("")
      return
    }
    onChange([...value, tag])
    setQuery("")
    setHighlight(0)
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (open && filtered.length > 0 && highlight < filtered.length) {
        addTag(filtered[highlight])
      } else {
        addTag(query)
      }
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeTag(value.length - 1)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className="flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, i) => (
          <Badge key={`${tag}-${i}`} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(i)
              }}
              className="flex items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={value.length === 0 ? placeholder : ""}
          className="h-6 min-w-24 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120)
          }}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          onMouseDown={(e) => {
            // keep focus so blur doesn't close before click
            e.preventDefault()
            if (blurTimer.current) clearTimeout(blurTimer.current)
          }}
        >
          {filtered.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => {
                  addTag(s)
                  inputRef.current?.focus()
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  i === highlight
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground"
                )}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { TagInput }
