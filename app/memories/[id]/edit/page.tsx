import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { MemoryForm } from "@/components/memory-form"
import { getServerCaller } from "@/lib/trpc/server"

export default async function EditMemoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const serverCaller = await getServerCaller()
  const memory = await serverCaller.memory.get({ id }).catch(() => null)

  // Only the author can edit; everyone else gets a 404.
  if (!memory || !memory.isMine) notFound()

  return (
    <main className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <Link
          href="/memories"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Memories
        </Link>
        <h1 className="font-hand text-4xl text-ink">Edit your note</h1>
        <MemoryForm
          memoryId={memory.id}
          initial={{ body: memory.body, authorName: memory.authorName, recipeId: memory.recipeId }}
        />
      </div>
    </main>
  )
}
