import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RecipesBrowser } from "@/components/recipes-browser"
import { getServerCaller } from "@/lib/trpc/server"

export default async function RecipesPage() {
  const serverCaller = await getServerCaller()
  const [recipes, favoriteIds] = await Promise.all([
    serverCaller.recipe.list(),
    serverCaller.recipe.favoriteIds(),
  ])

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Recipes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            </p>
          </div>
          <Button asChild>
            <Link href="/new-recipe">
              <Plus />
              Add Recipe
            </Link>
          </Button>
        </div>
        <RecipesBrowser recipes={recipes} favoriteIds={favoriteIds} />
      </div>
    </main>
  )
}
