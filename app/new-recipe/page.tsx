"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ChevronLeft,
  Plus,
  X,
  GripVertical,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { TagInput } from "@/components/ui/tag-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc/client"
import { MEAL_CATEGORIES } from "@/lib/categories"

type Ingredient = { amount: string; ingredient: string }
type IngredientGroup = { name: string; items: Ingredient[] }
const emptyIngredient = (): Ingredient => ({ amount: "", ingredient: "" })
const emptyGroup = (): IngredientGroup => ({ name: "", items: [emptyIngredient()] })

export default function NewRecipePage() {
  const router = useRouter()
  const createRecipe = trpc.recipe.create.useMutation({
    onSuccess: () => router.push("/recipes"),
  })
  const tagListQuery = trpc.recipe.tagList.useQuery()

  // Manual form
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>([
    { name: "", items: [emptyIngredient(), emptyIngredient(), emptyIngredient()] },
  ])
  const [steps, setSteps] = useState<string[]>(["", ""])

  // ── Manual form helpers ──────────────────────────────────
  function updateGroupName(gi: number, name: string) {
    setIngredientGroups((prev) =>
      prev.map((g, idx) => (idx === gi ? { ...g, name } : g))
    )
  }
  function addGroup() {
    setIngredientGroups((prev) => [...prev, emptyGroup()])
  }
  function removeGroup(gi: number) {
    if (ingredientGroups.length <= 1) return
    setIngredientGroups((prev) => prev.filter((_, idx) => idx !== gi))
  }
  function updateIngredient(gi: number, ii: number, field: keyof Ingredient, value: string) {
    setIngredientGroups((prev) =>
      prev.map((g, gIdx) =>
        gIdx !== gi ? g : {
          ...g,
          items: g.items.map((row, iIdx) => (iIdx === ii ? { ...row, [field]: value } : row)),
        }
      )
    )
  }
  function addIngredient(gi: number) {
    setIngredientGroups((prev) =>
      prev.map((g, idx) => (idx !== gi ? g : { ...g, items: [...g.items, emptyIngredient()] }))
    )
  }
  function removeIngredient(gi: number, ii: number) {
    setIngredientGroups((prev) =>
      prev.map((g, gIdx) =>
        gIdx !== gi ? g : { ...g, items: g.items.filter((_, iIdx) => iIdx !== ii) }
      )
    )
  }
  function updateStep(i: number, value: string) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? value : s)))
  }
  function addStep() {
    setSteps((prev) => [...prev, ""])
  }
  function removeStep(i: number) {
    if (steps.length <= 1) return
    setSteps((prev) => prev.filter((_, idx) => idx !== i))
  }

  // ── Save ─────────────────────────────────────────────────
  function handleSave() {
    createRecipe.mutate({
      title: title.trim(),
      category: category || null,
      tags,
      ingredients: ingredientGroups
        .map((g) => ({ ...g, items: g.items.filter((r) => r.amount.trim() || r.ingredient.trim()) }))
        .filter((g) => g.items.length > 0),
      steps: steps.filter((s) => s.trim()),
      source: "manual",
    })
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Back */}
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Recipes
        </Link>

        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          New Recipe
        </h1>

        {/* ── Manual form ─────────────────────────────────── */}
        <div className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. Jalapeño Poppers"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label>
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category…" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagListQuery.data ?? []}
              placeholder="e.g. Game Day, Spicy"
            />
            <p className="text-xs text-muted-foreground">
              Type and press Enter to add a tag
            </p>
          </div>

          <Separator />

          {/* Ingredients */}
          <div className="space-y-6">
            <h2 className="font-heading text-base font-medium">Ingredients</h2>

            {ingredientGroups.map((group, gi) => (
              <div key={gi} className="space-y-3">
                {/* Section header row */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={gi === 0 ? "Section name (optional, e.g. Sauce)" : "Section name, e.g. Glaze"}
                    value={group.name}
                    onChange={(e) => updateGroupName(gi, e.target.value)}
                    className="flex-1 text-sm font-medium"
                  />
                  {ingredientGroups.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGroup(gi)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="mr-1 size-3.5" />
                      Remove section
                    </Button>
                  )}
                </div>

                {/* Column labels */}
                <div className="flex gap-2 pl-6">
                  <span className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Amount
                  </span>
                  <span className="flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Ingredient
                  </span>
                </div>

                {/* Ingredient rows */}
                <div className="space-y-2">
                  {group.items.map((row, ii) => (
                    <div key={ii} className="flex items-center gap-2">
                      <GripVertical className="size-4 shrink-0 text-muted-foreground/30" />
                      <Input
                        placeholder="1 cup"
                        value={row.amount}
                        onChange={(e) => updateIngredient(gi, ii, "amount", e.target.value)}
                        className="w-28 shrink-0"
                      />
                      <Input
                        placeholder="All-purpose flour"
                        value={row.ingredient}
                        onChange={(e) => updateIngredient(gi, ii, "ingredient", e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(gi, ii)}
                        disabled={group.items.length <= 1}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label="Remove ingredient"
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" size="sm" onClick={() => addIngredient(gi)}>
                  <Plus />
                  Add Ingredient
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addGroup}>
              <Plus />
              Add Ingredient Section
            </Button>
          </div>

          <Separator />

          {/* Steps */}
          <div className="space-y-4">
            <h2 className="font-heading text-base font-medium">Steps</h2>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <Textarea
                    placeholder={`Step ${i + 1}…`}
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    rows={2}
                    className="flex-1 resize-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                    className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove step"
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus />
              Add Step
            </Button>
          </div>

          <Separator />

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!title.trim() || !category || createRecipe.isPending}
          >
            {createRecipe.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save Recipe"
            )}
          </Button>

          {createRecipe.isError && (
            <p className="text-center text-sm text-destructive">
              Failed to save. Please try again.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
