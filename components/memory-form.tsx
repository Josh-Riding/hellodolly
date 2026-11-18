"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RecipePicker } from "@/components/recipe-picker"
import { PaperSheet } from "@/components/memory-note"
import { trpc } from "@/lib/trpc/client"

/** Write or edit a memory. Used by /memories/new and /memories/[id]/edit. */
export function MemoryForm({
  memoryId,
  initial,
}: {
  memoryId?: string
  initial: { body: string; authorName: string; recipeId: string | null }
}) {
  const router = useRouter()
  const [body, setBody] = useState(initial.body)
  const [authorName, setAuthorName] = useState(initial.authorName)
  const [recipeId, setRecipeId] = useState(initial.recipeId)

  const recipesQuery = trpc.recipe.list.useQuery()
  const onSuccess = () => router.push("/memories")
  const create = trpc.memory.create.useMutation({ onSuccess })
  const update = trpc.memory.update.useMutation({ onSuccess })
  const saving = create.isPending || update.isPending
  const failed = create.isError || update.isError
  const canSave = body.trim() !== "" && authorName.trim() !== "" && !saving

  function save() {
    const fields = {
      body: body.trim(),
      authorName: authorName.trim(),
      recipeId,
    }
    if (memoryId) update.mutate({ id: memoryId, ...fields })
    else create.mutate(fields)
  }

  return (
    <div className="space-y-8">
      <PaperSheet className="pb-6">
        <label htmlFor="memory-body" className="sr-only">Your memory</label>
        <textarea
          id="memory-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="I still remember the smell of…"
          rows={9}
          autoFocus={!memoryId}
          className="block min-h-72 w-full resize-none bg-transparent pb-0 pl-10 pr-5 pt-8 font-hand text-2xl leading-8 text-ink outline-none [field-sizing:content] placeholder:text-ink/40"
        />
        <div className="flex items-baseline justify-end gap-2 pl-10 pr-5">
          <label htmlFor="memory-author" className="font-hand text-2xl leading-8 text-ink">—</label>
          <input
            id="memory-author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="your name"
            autoComplete="name"
            className="w-44 border-b border-dashed border-ink/30 bg-transparent font-hand text-2xl leading-8 text-ink outline-none placeholder:text-ink/40 focus:border-ink"
          />
        </div>
        <p className="mt-1 pr-5 text-right text-xs text-muted-foreground">Sign it however you like</p>
      </PaperSheet>

      <div className="space-y-2">
        <Label htmlFor="memory-recipe">
          Is it about a recipe? <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <RecipePicker
          id="memory-recipe"
          recipes={recipesQuery.data ?? []}
          value={recipeId}
          onChange={setRecipeId}
        />
      </div>

      {failed && (
        <p className="text-center text-sm text-destructive">Couldn&apos;t save your note. Please try again.</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button onClick={save} disabled={!canSave} className="h-11 sm:flex-1">
          {saving ? (
            <>
              <Loader2 className="animate-spin" />
              Saving…
            </>
          ) : memoryId ? (
            "Save changes"
          ) : (
            "Post this note"
          )}
        </Button>
        <Button asChild variant="outline" className="h-11 bg-background">
          <Link href="/memories">Cancel</Link>
        </Button>
      </div>
    </div>
  )
}
