"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { IngredientsEditor, StepsEditor, emptyIngredient, enterMovesTo } from "@/components/recipe-editors"
import type { IngredientGroup } from "@/db/schema"

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
              onKeyDown={enterMovesTo("amount-0-0")}
              enterKeyHint="next"
              autoCapitalize="words"
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
