"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role
      if (role === "ADMIN") {
        router.push("/admin/dashboard")
      } else if (role === "ORGANIZATION") {
        router.push("/organization/dashboard")
      } else {
        router.push("/volunteer/dashboard")
      }
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting...</p>
    </div>
  )
}


