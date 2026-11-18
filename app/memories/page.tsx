import Link from "next/link"
import { ChevronLeft, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MemoryNote, PaperSheet } from "@/components/memory-note"
import { getServerCaller } from "@/lib/trpc/server"

export default async function MemoriesPage() {
  const serverCaller = await getServerCaller()
  const memories = await serverCaller.memory.list()

  return (
    <main className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl space-y-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Home
        </Link>

        <header className="space-y-3 text-center">
          <h1 className="font-hand text-5xl text-ink">Kitchen Memories</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Little notes about the food we love, and the people who made it.
          </p>
          <Button asChild className="h-11 px-5">
            <Link href="/memories/new">
              <PenLine />
              Leave a note
            </Link>
          </Button>
        </header>

        {memories.length === 0 ? (
          <PaperSheet>
            <p className="pb-8 pl-10 pr-5 pt-8 font-hand text-2xl leading-8 text-ink/70">
              No notes yet. Be the first — a favorite dish, a kitchen smell, a story from the stove.
            </p>
          </PaperSheet>
        ) : (
          <ul className="space-y-10">
            {memories.map((m, i) => (
              <li key={m.id}>
                <MemoryNote note={m} index={i} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
