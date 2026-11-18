"use client"

import type { Dispatch, KeyboardEvent, ClipboardEvent, SetStateAction } from "react"
import { flushSync } from "react-dom"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagInput } from "@/components/ui/tag-input"
import { ComboInput } from "@/components/ui/combo-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trpc } from "@/lib/trpc/client"
import { MEAL_CATEGORIES } from "@/lib/categories"
import { splitPastedLines, parseIngredientLine } from "@/lib/parse-paste"
import type { Ingredient, IngredientGroup } from "@/db/schema"

// Shared form sections for /new-recipe and the recipe edit view — both pages render
// these, so a field added here shows up in both. Keep it that way.
//
// Keyboard flow: Return moves forward (adding a row at the end), Backspace on an empty
// row removes it. Fields carry id="f-<key>"; focus happens synchronously inside the
// key/tap handler (state flushed first) so iOS keeps the keyboard up.

export const emptyIngredient = (): Ingredient => ({ amount: "", ingredient: "" })
export const emptyGroup = (): IngredientGroup => ({ name: "", items: [emptyIngredient()] })

export function focusField(key: string) {
  const el = document.getElementById(`f-${key}`) as HTMLInputElement | HTMLTextAreaElement | null
  if (!el) return
  el.focus()
  el.setSelectionRange(el.value.length, el.value.length)
}

export const isEnter = (e: KeyboardEvent) => e.key === "Enter" && !e.nativeEvent.isComposing

/** Return in a field → move to `nextKey`. */
export const enterMovesTo = (nextKey: string) => (e: KeyboardEvent) => {
  if (!isEnter(e)) return
  e.preventDefault()
  focusField(nextKey)
}

// Bigger tap targets on phones, compact from `sm` up.
const ADD_BUTTON = "h-10 px-3 sm:h-7 sm:px-2.5"
const REMOVE_BUTTON = "size-10 shrink-0 text-muted-foreground hover:text-destructive sm:size-8"

// ── Title / category / kitchen / tags ──────────────────────

export function RecipeDetailsFields({
  title,
  setTitle,
  category,
  setCategory,
  kitchen,
  setKitchen,
  tags,
  setTags,
  requireCategory = false,
}: {
  title: string
  setTitle: (v: string) => void
  category: string
  setCategory: (v: string) => void
  kitchen: string
  setKitchen: (v: string) => void
  tags: string[]
  setTags: (v: string[]) => void
  requireCategory?: boolean
}) {
  const tagListQuery = trpc.recipe.tagList.useQuery()
  const kitchenListQuery = trpc.recipe.kitchenList.useQuery()
  const required = <span className="text-destructive">*</span>

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="f-title">Title {required}</Label>
        <Input
          id="f-title"
          placeholder="e.g. Jalapeño Poppers"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={enterMovesTo("kitchen")}
          enterKeyHint="next"
          autoCapitalize="words"
          className="h-10 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label>Category {requireCategory && required}</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category…" />
          </SelectTrigger>
          <SelectContent>
            {MEAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-kitchen">Kitchen</Label>
        <ComboInput
          id="f-kitchen"
          onEnter={() => focusField("amount-0-0")}
          enterKeyHint="next"
          value={kitchen}
          onChange={setKitchen}
          suggestions={kitchenListQuery.data ?? []}
          placeholder="e.g. Grandma Shirleen"
        />
        <p className="text-xs text-muted-foreground">Whose kitchen this recipe comes from</p>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput
          value={tags}
          onChange={setTags}
          suggestions={tagListQuery.data ?? []}
          placeholder="e.g. Game Day, Spicy"
        />
        <p className="text-xs text-muted-foreground">Type and press Enter to add a tag</p>
      </div>
    </>
  )
}

// ── Ingredients ────────────────────────────────────────────

export function IngredientsEditor({
  groups,
  setGroups,
}: {
  groups: IngredientGroup[]
  setGroups: Dispatch<SetStateAction<IngredientGroup[]>>
}) {
  const updateGroupItems = (gi: number, fn: (items: Ingredient[]) => Ingredient[]) =>
    setGroups((prev) => prev.map((g, idx) => (idx === gi ? { ...g, items: fn(g.items) } : g)))

  function updateGroupName(gi: number, name: string) {
    setGroups((prev) => prev.map((g, idx) => (idx === gi ? { ...g, name } : g)))
  }
  function removeGroup(gi: number) {
    if (groups.length <= 1) return
    setGroups((prev) => prev.filter((_, idx) => idx !== gi))
  }
  function updateIngredient(gi: number, ii: number, field: keyof Ingredient, value: string) {
    updateGroupItems(gi, (items) => items.map((row, idx) => (idx === ii ? { ...row, [field]: value } : row)))
  }
  function removeIngredient(gi: number, ii: number) {
    updateGroupItems(gi, (items) => items.filter((_, idx) => idx !== ii))
  }
  function addIngredientAndFocus(gi: number) {
    const next = groups[gi].items.length
    flushSync(() => updateGroupItems(gi, (items) => [...items, emptyIngredient()]))
    focusField(`amount-${gi}-${next}`)
  }
  function addGroupAndFocus() {
    const next = groups.length
    flushSync(() => setGroups((prev) => [...prev, emptyGroup()]))
    focusField(`group-${next}`)
  }

  function onAmountKeyDown(e: KeyboardEvent, gi: number, ii: number) {
    const items = groups[gi].items
    const row = items[ii]
    if (isEnter(e)) {
      e.preventDefault()
      focusField(`ingredient-${gi}-${ii}`)
    } else if (e.key === "Backspace" && !row.amount && !row.ingredient && items.length > 1) {
      e.preventDefault()
      flushSync(() => removeIngredient(gi, ii))
      focusField(ii > 0 ? `ingredient-${gi}-${ii - 1}` : `amount-${gi}-0`)
    }
  }
  function onIngredientKeyDown(e: KeyboardEvent, gi: number, ii: number) {
    const items = groups[gi].items
    const row = items[ii]
    if (isEnter(e)) {
      e.preventDefault()
      if (ii < items.length - 1) focusField(`amount-${gi}-${ii + 1}`)
      else if (row.amount.trim() || row.ingredient.trim()) addIngredientAndFocus(gi)
    } else if (e.key === "Backspace" && !row.ingredient) {
      e.preventDefault()
      focusField(`amount-${gi}-${ii}`)
    }
  }

  // Pasting several lines → one row per line, split into amount / ingredient.
  // Fills the current row if it's empty, otherwise inserts below it.
  function onIngredientPaste(e: ClipboardEvent, gi: number, ii: number) {
    const lines = splitPastedLines(e.clipboardData.getData("text"))
    if (lines.length < 2) return
    e.preventDefault()
    const rows = lines.map(parseIngredientLine)
    const current = groups[gi].items[ii]
    const start = current.amount.trim() || current.ingredient.trim() ? ii + 1 : ii
    flushSync(() =>
      updateGroupItems(gi, (items) => [...items.slice(0, start), ...rows, ...items.slice(ii + 1)])
    )
    focusField(`ingredient-${gi}-${start + rows.length - 1}`)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-base font-medium">Ingredients</h2>
        <p className="text-xs text-muted-foreground">
          Tip: paste a whole ingredient list into any box to split it into rows.
        </p>
      </div>

      {groups.map((group, gi) => (
        <div key={gi} className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              id={`f-group-${gi}`}
              placeholder={gi === 0 ? "Section name (optional, e.g. Sauce)" : "Section name, e.g. Glaze"}
              value={group.name}
              onChange={(e) => updateGroupName(gi, e.target.value)}
              onKeyDown={enterMovesTo(`amount-${gi}-0`)}
              enterKeyHint="next"
              className="flex-1 text-sm font-medium"
            />
            {groups.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeGroup(gi)}
                className={`${ADD_BUTTON} shrink-0 text-muted-foreground hover:text-destructive`}
              >
                <X className="mr-1 size-3.5" />
                Remove section
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <span className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-28">
              Amount
            </span>
            <span className="flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ingredient
            </span>
          </div>

          <div className="space-y-2">
            {group.items.map((row, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <Input
                  id={`f-amount-${gi}-${ii}`}
                  placeholder="1 cup"
                  value={row.amount}
                  onChange={(e) => updateIngredient(gi, ii, "amount", e.target.value)}
                  onKeyDown={(e) => onAmountKeyDown(e, gi, ii)}
                  onPaste={(e) => onIngredientPaste(e, gi, ii)}
                  enterKeyHint="next"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-20 shrink-0 sm:w-28"
                />
                <Input
                  id={`f-ingredient-${gi}-${ii}`}
                  placeholder="All-purpose flour"
                  value={row.ingredient}
                  onChange={(e) => updateIngredient(gi, ii, "ingredient", e.target.value)}
                  onKeyDown={(e) => onIngredientKeyDown(e, gi, ii)}
                  onPaste={(e) => onIngredientPaste(e, gi, ii)}
                  enterKeyHint="next"
                  className="min-w-0 flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(gi, ii)}
                  disabled={group.items.length <= 1}
                  className={REMOVE_BUTTON}
                  aria-label="Remove ingredient"
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => addIngredientAndFocus(gi)} className={ADD_BUTTON}>
            <Plus />
            Add Ingredient
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addGroupAndFocus} className={ADD_BUTTON}>
        <Plus />
        Add Ingredient Section
      </Button>
    </div>
  )
}

// ── Steps ──────────────────────────────────────────────────

export function StepsEditor({
  steps,
  setSteps,
}: {
  steps: string[]
  setSteps: Dispatch<SetStateAction<string[]>>
}) {
  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? value : s)))
  }
  function removeStep(i: number) {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, idx) => idx !== i))
  }
  function addStepAndFocus() {
    const next = steps.length
    flushSync(() => setSteps((prev) => [...prev, ""]))
    focusField(`step-${next}`)
  }

  // Return = new step right after this one (Shift+Return still makes a line break).
  function onStepKeyDown(e: KeyboardEvent, i: number) {
    if (isEnter(e) && !e.shiftKey) {
      e.preventDefault()
      if (!steps[i].trim()) return
      flushSync(() => setSteps((prev) => [...prev.slice(0, i + 1), "", ...prev.slice(i + 1)]))
      focusField(`step-${i + 1}`)
    } else if (e.key === "Backspace" && !steps[i] && steps.length > 1) {
      e.preventDefault()
      flushSync(() => removeStep(i))
      focusField(`step-${Math.max(i - 1, 0)}`)
    }
  }

  // Pasting several lines → one step per line (numbering stripped).
  function onStepPaste(e: ClipboardEvent, i: number) {
    const lines = splitPastedLines(e.clipboardData.getData("text"))
    if (lines.length < 2) return
    e.preventDefault()
    const start = steps[i].trim() ? i + 1 : i
    flushSync(() => setSteps((prev) => [...prev.slice(0, start), ...lines, ...prev.slice(i + 1)]))
    focusField(`step-${start + lines.length - 1}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-base font-medium">Steps</h2>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 sm:gap-3">
            <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <Textarea
              id={`f-step-${i}`}
              placeholder={`Step ${i + 1}…`}
              value={step}
              onChange={(e) => updateStep(i, e.target.value)}
              onKeyDown={(e) => onStepKeyDown(e, i)}
              onPaste={(e) => onStepPaste(e, i)}
              enterKeyHint="next"
              rows={2}
              className="min-w-0 flex-1 resize-none"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStep(i)}
              disabled={steps.length <= 1}
              className={REMOVE_BUTTON}
              aria-label="Remove step"
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addStepAndFocus} className={ADD_BUTTON}>
        <Plus />
        Add Step
      </Button>
    </div>
  )
}
