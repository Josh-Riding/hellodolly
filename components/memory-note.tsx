import Link from "next/link"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

type Note = {
  id: string
  body: string
  authorName: string
  recipeTitle: string | null
  recipeSlug: string | null
  isMine: boolean
}

// A slight, varied tilt so the notes look pinned up by hand.
const TILTS = ["-rotate-[0.6deg]", "rotate-[0.5deg]", "-rotate-[0.2deg]", "rotate-[0.8deg]"]

/** Notepaper sheet: ruled lines, tape strip, handwriting. */
export function PaperSheet({
  tilt = 0,
  className,
  children,
}: {
  tilt?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "relative bg-paper paper-ruled shadow-[0_1px_2px_rgb(0_0_0/0.06),0_10px_24px_-12px_rgb(0_0_0/0.3)]",
        TILTS[tilt % TILTS.length],
        className
      )}
    >
      <span
        aria-hidden
        className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 bg-tape"
      />
      {children}
    </div>
  )
}

/** Loose ballpoint loop drawn around a word — overshoots its start like a real pen circle. */
function PenCircle() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -left-1.5 -top-1 h-[calc(100%+0.5rem)] w-[calc(100%+0.75rem)] -rotate-1 overflow-visible text-ink/80"
    >
      <path
        d="M150 15 C110 4 48 3 20 15 C2 23 6 47 34 54 C76 63 152 61 184 47 C200 39 200 19 178 10 C166 5 150 3 136 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function MemoryNote({ note, index }: { note: Note; index: number }) {
  return (
    <PaperSheet tilt={index}>
      <article className="pb-5 pl-10 pr-5 pt-8">
        <p className="whitespace-pre-wrap break-words font-hand text-2xl leading-8 text-ink">
          {note.body}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-4">
          {note.recipeSlug && (
            <Link
              href={`/recipe/${note.recipeSlug}`}
              className="relative ml-1 inline-flex min-h-9 items-center px-4 font-hand text-xl leading-8 text-ink"
            >
              <PenCircle />
              {note.recipeTitle}
            </Link>
          )}
          <p className="ml-auto font-hand text-2xl leading-8 text-ink">— {note.authorName}</p>
        </div>

        {note.isMine && (
          <footer className="mt-2 text-xs text-muted-foreground">
            <Link
              href={`/memories/${note.id}/edit`}
              className="inline-flex min-h-9 items-center gap-1 pr-3 transition-colors hover:text-foreground"
            >
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </footer>
        )}
      </article>
    </PaperSheet>
  )
}
