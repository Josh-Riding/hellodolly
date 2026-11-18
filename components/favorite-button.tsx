"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc/client"

export function FavoriteButton({
  recipeId,
  initialFavorite,
}: {
  recipeId: string
  initialFavorite: boolean
}) {
  const [favorite, setFavorite] = useState(initialFavorite)
  const setFavoriteMutation = trpc.recipe.setFavorite.useMutation({
    // Optimistic: flip immediately, roll back if the save fails.
    onError: (_err, vars) => setFavorite(!vars.favorite),
  })

  function toggle() {
    const next = !favorite
    setFavorite(next)
    setFavoriteMutation.mutate({ recipeId, favorite: next })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={favorite ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5"} />
      {favorite ? "Favorited" : "Favorite"}
    </Button>
  )
}
