import { notFound } from "next/navigation"
import { getServerCaller } from "@/lib/trpc/server"
import { RecipeDetail } from "@/components/recipe-detail"

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const serverCaller = await getServerCaller()
  const recipe = await serverCaller.recipe.get({ slug })

  if (!recipe) notFound()

  const favoriteIds = await serverCaller.recipe.favoriteIds()

  return <RecipeDetail recipe={recipe} initialFavorite={favoriteIds.includes(recipe.id)} />
}
