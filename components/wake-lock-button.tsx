"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const noopSubscribe = () => () => {}

export function WakeLockButton() {
  // false on the server, real answer after hydration
  const supported = useSyncExternalStore(
    noopSubscribe,
    () => "wakeLock" in navigator,
    () => false,
  )
  const [wanted, setWanted] = useState(false)
  const [active, setActive] = useState(false)
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!wanted) return
    let cancelled = false

    async function acquire() {
      if (document.visibilityState !== "visible" || lockRef.current) return
      try {
        const lock = await navigator.wakeLock.request("screen")
        if (cancelled) {
          lock.release()
          return
        }
        lockRef.current = lock
        setActive(true)
        lock.addEventListener("release", () => {
          lockRef.current = null
          setActive(false)
        })
      } catch {
        // Denied (e.g. low battery mode) — leave the button off.
        setWanted(false)
      }
    }

    // The browser drops the lock whenever the tab is hidden; take it back on return.
    acquire()
    document.addEventListener("visibilitychange", acquire)
    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", acquire)
      lockRef.current?.release()
      lockRef.current = null
      setActive(false)
    }
  }, [wanted])

  if (!supported) return null

  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={() => setWanted((w) => !w)}
      aria-pressed={active}
      className="shrink-0"
    >
      <Sun className="size-3.5" />
      {active ? "Screen on" : "Keep screen on"}
    </Button>
  )
}
