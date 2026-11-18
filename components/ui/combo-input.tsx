"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ComboInputProps = {
  id?: string
  /** Enter pressed without picking a suggestion */
  onEnter?: () => void
  enterKeyHint?: React.ComponentProps<"input">["enterKeyHint"]
  value: string
  onChange: (value: string) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
}

// Free-text input with a styled suggestion list (single value; see TagInput for multi).
function ComboInput({
  id,
  onEnter,
  enterKeyHint,
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
}: ComboInputProps) {
  const [open, setOpen] = React.useState(false)
  // Only filter once the user types; on focus, show everything so a saved value can be swapped.
  const [typed, setTyped] = React.useState(false)
  const [highlight, setHighlight] = React.useState(-1)
  const blurTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!typed || !q) return suggestions
    return suggestions.filter((s) => s.toLowerCase().includes(q))
  }, [suggestions, value, typed])

  function pick(s: string) {
    onChange(s)
    setOpen(false)
    setTyped(false)
    setHighlight(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter" && open && highlight >= 0 && highlight < filtered.length) {
      e.preventDefault()
      pick(filtered[highlight])
    } else if (e.key === "Enter" && onEnter && !e.nativeEvent.isComposing) {
      e.preventDefault()
      setOpen(false)
      onEnter()
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        enterKeyHint={enterKeyHint}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value)
          setTyped(true)
          setOpen(true)
          setHighlight(-1)
        }}
        onFocus={() => {
          setTyped(false)
          setOpen(true)
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={handleKeyDown}
      />

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
                onClick={() => pick(s)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  i === highlight ? "bg-accent text-accent-foreground" : "text-foreground"
                )}
              >
                {s}
                {s === value.trim() && <Check className="size-3.5 text-muted-foreground" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export { ComboInput }
