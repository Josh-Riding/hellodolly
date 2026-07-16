"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpc/client"

type Step = "username" | "password" | "create-password"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") || "/"

  const [step, setStep] = useState<Step>("username")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const utils = trpc.useUtils()
  const claim = trpc.user.claim.useMutation()

  async function handleContinue() {
    setError(null)
    if (!username.trim()) return
    setChecking(true)
    try {
      const result = await utils.user.needsSetup.fetch({ username })
      if (!result.exists) {
        setError("No account with that username. Ask an admin to add you.")
        return
      }
      setStep(result.needsSetup ? "create-password" : "password")
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setChecking(false)
    }
  }

  async function handleSignIn() {
    setError(null)
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    })
    if (res?.error) {
      setError("Incorrect password.")
      return
    }
    router.push(from)
    router.refresh()
  }

  async function handleCreatePassword() {
    setError(null)
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    try {
      await claim.mutateAsync({ username, password })
      await handleSignIn()
    } catch {
      setError("Couldn't set up that account. Try again.")
    }
  }

  function handleBack() {
    setError(null)
    setPassword("")
    setConfirmPassword("")
    setStep("username")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="mx-auto w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === "create-password"
              ? "First time here — create a password."
              : "The family cookbook."}
          </p>
        </div>

        <div className="space-y-4">
          {step === "username" && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                autoFocus
                autoComplete="username"
              />
            </div>
          )}

          {step === "password" && (
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-muted-foreground">({username})</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                autoFocus
                autoComplete="current-password"
              />
            </div>
          )}

          {step === "create-password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  New password <span className="text-muted-foreground">({username})</span>
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePassword()}
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {step === "username" && (
            <Button className="w-full" onClick={handleContinue} disabled={checking}>
              {checking ? <Loader2 className="animate-spin" /> : "Continue"}
            </Button>
          )}

          {step === "password" && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSignIn}>
                Sign in
              </Button>
            </div>
          )}

          {step === "create-password" && (
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} disabled={claim.isPending}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleCreatePassword}
                disabled={claim.isPending}
              >
                {claim.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Create password & sign in"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
