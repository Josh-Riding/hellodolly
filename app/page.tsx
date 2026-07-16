import Link from "next/link"
import { BookOpen, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/sign-out-button"

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <SignOutButton />
      </div>

      <div className="mx-auto max-w-md space-y-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmcyeWY2b21rYTQwcDV5cjZ0Zng5aWRibXJreDFmemx3MXFid3R4MCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mFQg2g95sQWT6/giphy.gif"
          alt=""
          className="mx-auto h-40 w-auto rounded-lg"
        />
        <div className="space-y-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Family Cookbook
          </h1>
          <p className="text-sm text-muted-foreground">
            Search what&apos;s here, or add something new.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/recipes">
              <BookOpen />
              Browse Recipes
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/new-recipe">
              <Plus />
              Add a Recipe
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
