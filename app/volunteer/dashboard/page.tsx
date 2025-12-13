"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Application {
  id: string
  status: string
  createdAt: string
  post: {
    id: string
    title: string
    category: string
    organization: {
      name: string | null
    } | null
  }
}

export default function VolunteerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "VOLUNTEER") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchApplications()
    }
  }, [session, status, router])

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/applications/my", {
        cache: "no-store",
      })
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (applicationId: string) => {
    if (!confirm("Are you sure you want to withdraw your application? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchApplications() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || "Failed to withdraw application")
      }
    } catch (error) {
      console.error("Error withdrawing application:", error)
      alert("An error occurred while withdrawing your application")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Volunteer Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {session?.user?.name}!
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/posts">
              <Button>Browse Opportunities</Button>
            </Link>
            <Link href="/volunteer/certificates">
              <Button variant="outline">My Certificates</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
              <CardDescription>
                {applications.length} total application(s)
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>
                {applications.filter((a) => a.status === "PENDING").length}{" "}
                pending
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Approved</CardTitle>
              <CardDescription>
                {applications.filter((a) => a.status === "APPROVED").length}{" "}
                approved
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Applications</h2>
          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't applied to any opportunities yet.
                </p>
                <Link href="/posts">
                  <Button>Browse Opportunities</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <div className="relative h-32 w-full">
                  <img
                    src={
                      application.post.category === "ENVIRONMENT"
                        ? "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=150&fit=crop"
                        : application.post.category === "EDUCATION"
                        ? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=150&fit=crop"
                        : application.post.category === "HEALTHCARE"
                        ? "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=150&fit=crop"
                        : application.post.category === "COMMUNITY"
                        ? "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=150&fit=crop"
                        : "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=150&fit=crop"
                    }
                    alt={application.post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        application.status === "APPROVED"
                          ? "default"
                          : application.status === "REJECTED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {application.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{application.post.title}</CardTitle>
                      <CardDescription>
                        {application.post.organization?.name || "Individual"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{application.post.category}</Badge>
                    <div className="flex gap-2">
                      <Link href={`/posts/${application.post.id}`}>
                        <Button variant="outline">View Post</Button>
                      </Link>
                      {application.status === "PENDING" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleWithdraw(application.id)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


