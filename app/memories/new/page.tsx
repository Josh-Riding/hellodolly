import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { auth } from "@/auth"
import { MemoryForm } from "@/components/memory-form"

export default async function NewMemoryPage() {
  const session = await auth()
  const username = session?.user?.name ?? ""
  // Prefill the signature with their username ("josh" → "Josh"); they can change it.
  const authorName = username.charAt(0).toUpperCase() + username.slice(1)

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
        <h1 className="font-hand text-4xl text-ink">Leave a note</h1>
        <MemoryForm initial={{ body: "", authorName, recipeId: null }} />
      </div>
    </main>
  )
}
