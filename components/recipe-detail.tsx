"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, Pencil, X, Plus, GripVertical, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { TagInput } from "@/components/ui/tag-input"
import { WakeLockButton } from "@/components/wake-lock-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { trpc } from "@/lib/trpc/client"
import { MEAL_CATEGORIES } from "@/lib/categories"
import type { Recipe, IngredientGroup, Ingredient } from "@/db/schema"

const emptyIngredient = (): Ingredient => ({ amount: "", ingredient: "" })
const emptyGroup = (): IngredientGroup => ({ name: "", items: [emptyIngredient()] })

export function RecipeDetail({ recipe: initialRecipe }: { recipe: Recipe }) {
  const router = useRouter()
  const [localRecipe, setLocalRecipe] = useState(initialRecipe)
  const [isEditing, setIsEditing] = useState(false)

  // Edit form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>([emptyGroup()])
  const [steps, setSteps] = useState<string[]>([""])

  // Unsaved-changes guard: snapshot of the form as it was when editing began.
  const [snapshot, setSnapshot] = useState<string>("")
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const dirty =
    isEditing &&
    JSON.stringify({ title, category, tags, ingredientGroups, steps }) !== snapshot

  // Warn on browser tab close / refresh / hard navigation while dirty.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])

  const tagListQuery = trpc.recipe.tagList.useQuery()

  const updateRecipe = trpc.recipe.update.useMutation({
    onSuccess: (updated) => {
      setLocalRecipe(updated)
      setIsEditing(false)
    },
  })

  const deleteRecipe = trpc.recipe.delete.useMutation({
    onSuccess: () => router.push("/recipes"),
  })

  function enterEditMode() {
    setTitle(localRecipe.title)
    setCategory(localRecipe.category ?? "")
    setTags(localRecipe.tags)
    setIngredientGroups(
      localRecipe.ingredients.length > 0
        ? localRecipe.ingredients
        : [emptyGroup()]
    )
    setSteps(localRecipe.steps.length > 0 ? localRecipe.steps : [""])
    // Snapshot the initial state so we can detect unsaved changes on exit.
    setSnapshot(JSON.stringify({
      title: localRecipe.title,
      category: localRecipe.category ?? "",
      tags: localRecipe.tags,
      ingredientGroups:
        localRecipe.ingredients.length > 0 ? localRecipe.ingredients : [emptyGroup()],
      steps: localRecipe.steps.length > 0 ? localRecipe.steps : [""],
    }))
    setIsEditing(true)
  }

  function cancelEdit() {
    setShowLeaveConfirm(false)
    setIsEditing(false)
    updateRecipe.reset()
  }

  // Called by every "leave the editor" affordance. Confirms first if dirty.
  function attemptExit() {
    if (dirty) setShowLeaveConfirm(true)
    else cancelEdit()
  }

  function handleSave() {
    updateRecipe.mutate({
      id: localRecipe.id,
      title: title.trim(),
      category: category || null,
      tags,
      ingredients: ingredientGroups
        .map((g) => ({ ...g, items: g.items.filter((r) => r.amount.trim() || r.ingredient.trim()) }))
        .filter((g) => g.items.length > 0),
      steps: steps.filter((s) => s.trim()),
    })
  }

  // ── Ingredient group helpers ────────────────────────────
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

  // ── Step helpers ────────────────────────────────────────
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

  // ── View mode ───────────────────────────────────────────
  if (!isEditing) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 md:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/recipes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Recipes
          </Link>

          {/* Title + tags + edit button */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                {localRecipe.title}
              </h1>
              {(localRecipe.category || localRecipe.tags.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {localRecipe.category && (
                    <Badge variant="default">{localRecipe.category}</Badge>
                  )}
                  {localRecipe.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <WakeLockButton />
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <Pencil className="size-3.5" />
                Edit
              </Button>
            </div>
          </div>

          {/* Main card */}
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {/* Ingredients */}
                <div className="w-full shrink-0 md:w-72">
                  <CardHeader className="border-b">
                    <CardTitle className="text-base">Ingredients</CardTitle>
                  </CardHeader>
                  <div className="p-4">
                    {localRecipe.ingredients.length > 0 ? (
                      <div className="space-y-5">
                        {localRecipe.ingredients.map((group, gi) => (
                          <div key={gi}>
                            {group.name && (
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {group.name}
                              </p>
                            )}
                            <div className="space-y-2">
                              {group.items.map(({ amount, ingredient }, i) => (
                                <div key={i} className="flex gap-3 text-sm">
                                  <span className="w-20 shrink-0 text-right text-muted-foreground">
                                    {amount}
                                  </span>
                                  <span>{ingredient}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No ingredients listed.</p>
                    )}
                  </div>
                </div>

                <Separator orientation="vertical" className="hidden md:block" />
                <Separator className="md:hidden" />

                {/* Steps */}
                <div className="flex-1">
                  <CardHeader className="border-b">
                    <CardTitle className="text-base">Instructions</CardTitle>
                  </CardHeader>
                  {localRecipe.steps.length > 0 ? (
                    <ol className="space-y-4 p-4">
                      {localRecipe.steps.map((step, i) => (
                        <li key={i} className="flex gap-4 text-sm">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {i + 1}
                          </span>
                          <span className="pt-0.5 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground">No steps listed.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // ── Edit mode ───────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={attemptExit}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
            Cancel
          </button>
          <h1 className="font-heading text-xl font-semibold">Edit Recipe</h1>
          <div className="w-16" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="edit-title">Title</Label>
          <Input
            id="edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 text-base"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
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

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="edit-tags">Tags</Label>
          <TagInput
            value={tags}
            onChange={setTags}
            suggestions={tagListQuery.data ?? []}
            placeholder="e.g. Game Day, Spicy"
          />
          <p className="text-xs text-muted-foreground">Type and press Enter to add a tag</p>
        </div>

        <Separator />

        {/* Ingredient groups */}
        <div className="space-y-6">
          <h2 className="font-heading text-base font-medium">Ingredients</h2>

          {ingredientGroups.map((group, gi) => (
            <div key={gi} className="space-y-3">
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

              <div className="flex gap-2 pl-6">
                <span className="w-28 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount</span>
                <span className="flex-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ingredient</span>
              </div>

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

        {updateRecipe.isError && (
          <p className="text-center text-sm text-destructive">Failed to save. Please try again.</p>
        )}

        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={!title.trim() || updateRecipe.isPending}
          >
            {updateRecipe.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save Recipe"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={attemptExit}
            disabled={updateRecipe.isPending}
          >
            Cancel
          </Button>
        </div>

        <Separator />

        {/* Delete recipe */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              disabled={deleteRecipe.isPending}
            >
              {deleteRecipe.isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete recipe
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete “{localRecipe.title}”.
                This action can’t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteRecipe.mutate({ id: localRecipe.id })}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unsaved-changes guard — dismiss (X / click outside / Esc) = keep editing */}
        <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save your changes?</DialogTitle>
              <DialogDescription>
                You have unsaved changes. Save them before leaving?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={cancelEdit}
              >
                Exit without saving
              </Button>
              <Button
                onClick={() => {
                  setShowLeaveConfirm(false)
                  handleSave()
                }}
              >
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  )
}
