"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Application {
  id: string
  status: string
  message: string | null
  createdAt: string
  volunteer: {
    id: string
    name: string | null
    email: string
    image: string | null
    bio: string | null
    skills: string[]
  }
}

interface Post {
  id: string
  title: string
  description: string
  status: string
}

export default function PostApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (sessionStatus === "authenticated") {
      fetchData()
    }
  }, [sessionStatus, params.id, router])

  const fetchData = async () => {
    try {
      const [postResponse, applicationsResponse] = await Promise.all([
        fetch(`/api/posts/${params.id}`),
        fetch(`/api/posts/${params.id}/applications`),
      ])

      if (!postResponse.ok) {
        router.push("/organization/dashboard")
        return
      }

      const postData = await postResponse.json()
      setPost(postData)

      // Check if user owns the post
      if ((session?.user as any)?.id !== postData.authorId) {
        router.push("/organization/dashboard")
        return
      }

      if (applicationsResponse.ok) {
        const appsData = await applicationsResponse.json()
        setApplications(appsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error updating application:", error)
    }
  }

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Post not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{post.title}</CardTitle>
            <CardDescription>{post.description}</CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Applications ({applications.length})
          </h2>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No applications yet for this post.
                </p>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={application.volunteer.image || ""} />
                        <AvatarFallback>
                          {application.volunteer.name?.charAt(0) || "V"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{application.volunteer.name || "Volunteer"}</CardTitle>
                        <CardDescription>{application.volunteer.email}</CardDescription>
                      </div>
                    </div>
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
                </CardHeader>
                <CardContent>
                  {application.volunteer.bio && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {application.volunteer.bio}
                    </p>
                  )}
                  {application.volunteer.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {application.volunteer.skills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {application.message && (
                    <div className="mb-4 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">Message:</p>
                      <p className="text-sm text-muted-foreground">
                        {application.message}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {application.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleApplicationStatus(application.id, "APPROVED")
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleApplicationStatus(application.id, "REJECTED")
                          }
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Applied on {new Date(application.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

