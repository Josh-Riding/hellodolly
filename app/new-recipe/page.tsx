"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { trpc } from "@/lib/trpc/client"
import { IngredientsEditor, RecipeDetailsFields, StepsEditor, emptyIngredient } from "@/components/recipe-editors"
import type { IngredientGroup } from "@/db/schema"

export default function NewRecipePage() {
  const router = useRouter()
  const createRecipe = trpc.recipe.create.useMutation({
    onSuccess: () => router.push("/recipes"),
  })

  // Manual form
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [kitchen, setKitchen] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroup[]>([
    { name: "", items: [emptyIngredient(), emptyIngredient(), emptyIngredient()] },
  ])
  const [steps, setSteps] = useState<string[]>(["", ""])

  // ── Save ─────────────────────────────────────────────────
  function handleSave() {
    createRecipe.mutate({
      title: title.trim(),
      category: category || null,
      kitchen: kitchen.trim() || null,
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
          <RecipeDetailsFields
            title={title}
            setTitle={setTitle}
            category={category}
            setCategory={setCategory}
            kitchen={kitchen}
            setKitchen={setKitchen}
            tags={tags}
            setTags={setTags}
            requireCategory
          />

          <Separator />

          <IngredientsEditor groups={ingredientGroups} setGroups={setIngredientGroups} />

          <Separator />

          <StepsEditor steps={steps} setSteps={setSteps} />

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
