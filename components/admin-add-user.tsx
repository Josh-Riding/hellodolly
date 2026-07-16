"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc/client"

export function AdminAddUser() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [role, setRole] = useState<"admin" | "member">("member")

  const createUser = trpc.user.create.useMutation({
    onSuccess: () => {
      setUsername("")
      setRole("member")
      router.refresh()
    },
  })

  function handleSubmit() {
    if (!username.trim()) return
    createUser.mutate({ username, role })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="sm:max-w-48"
      />
      <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
        <SelectTrigger className="sm:w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleSubmit} disabled={!username.trim() || createUser.isPending}>
        {createUser.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
        Add person
      </Button>
      {createUser.error && (
        <p className="text-sm text-destructive sm:self-center">
          {createUser.error.message}
        </p>
      )}
    </div>
  )
}
