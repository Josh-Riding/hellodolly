"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChefHat, ChevronLeft, Pencil, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { WakeLockButton } from "@/components/wake-lock-button"
import { FavoriteButton } from "@/components/favorite-button"
import { IngredientsEditor, RecipeDetailsFields, StepsEditor, emptyGroup } from "@/components/recipe-editors"
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
import type { Recipe, IngredientGroup } from "@/db/schema"


export function RecipeDetail({
  recipe: initialRecipe,
  initialFavorite,
}: {
  recipe: Recipe
  initialFavorite: boolean
}) {
  const router = useRouter()
  const [localRecipe, setLocalRecipe] = useState(initialRecipe)
  const [isEditing, setIsEditing] = useState(false)

  // Edit form state
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [kitchen, setKitchen] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>([emptyGroup()])
  const [steps, setSteps] = useState<string[]>([""])

  // Unsaved-changes guard: snapshot of the form as it was when editing began.
  const [snapshot, setSnapshot] = useState<string>("")
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const dirty =
    isEditing &&
    JSON.stringify({ title, category, kitchen, tags, ingredientGroups, steps }) !== snapshot

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
    setKitchen(localRecipe.kitchen ?? "")
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
      kitchen: localRecipe.kitchen ?? "",
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
      kitchen: kitchen.trim() || null,
      tags,
      ingredients: ingredientGroups
        .map((g) => ({ ...g, items: g.items.filter((r) => r.amount.trim() || r.ingredient.trim()) }))
        .filter((g) => g.items.length > 0),
      steps: steps.filter((s) => s.trim()),
    })
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

          {/* Title + tags + actions (actions stack under the title on phones) */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                {localRecipe.title}
              </h1>
              {localRecipe.kitchen && (
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ChefHat className="size-4" />
                  {localRecipe.kitchen}
                </p>
              )}
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
            <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
              <FavoriteButton recipeId={localRecipe.id} initialFavorite={initialFavorite} />
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

        <RecipeDetailsFields
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          kitchen={kitchen}
          setKitchen={setKitchen}
          tags={tags}
          setTags={setTags}
        />

        <Separator />

        <IngredientsEditor groups={ingredientGroups} setGroups={setIngredientGroups} />

        <Separator />

        <StepsEditor steps={steps} setSteps={setSteps} />

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
