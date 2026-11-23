"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { apiFetch, ApiError } from "@/lib/api"
type User = { id: string | number; username: string; role: string }
const SessionContext = createContext<User | null>(null)
export const useSession = () => useContext(SessionContext)
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState("")
  const router = useRouter()
  useEffect(() => {
    let active = true
    apiFetch<{user: User}>("/api/auth/me").then(({ user }) => { if (active) setUser(user) }).catch(err => {
      if (!active) return
      if (err instanceof ApiError && err.status === 401) router.replace("/login")
      else setError(err instanceof Error ? err.message : "Unable to load session")
    })
    return () => { active = false }
  }, [router])
  if (error) return <div role="alert" className="p-8">{error} <button onClick={() => window.location.reload()}>Retry</button></div>
  if (!user) return <p className="p-8">Loading session…</p>
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
}
