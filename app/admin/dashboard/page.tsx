"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Stats {
  totalUsers: number
  totalPosts: number
  totalApplications: number
  flaggedPosts: number
}

interface FlaggedPost {
  id: string
  title: string
  status: string
  author: {
    name: string | null
  }
}

interface Post {
  id: string
  title: string
  description: string
  status: string
  category: string
  createdAt: string
  author: {
    name: string | null
    email: string
  }
  organization: {
    name: string | null
  } | null
  applications: { id: string }[]
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllPosts, setShowAllPosts] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchStats()
      fetchFlaggedPosts()
      fetchAllPosts()
    }
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlaggedPosts = async () => {
    try {
      const response = await fetch("/api/admin/flagged-posts")
      const data = await response.json()
      setFlaggedPosts(data)
    } catch (error) {
      console.error("Error fetching flagged posts:", error)
    }
  }

  const fetchAllPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts")
      const data = await response.json()
      setAllPosts(data)
    } catch (error) {
      console.error("Error fetching all posts:", error)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAllPosts()
        fetchFlaggedPosts()
        fetchStats()
      } else {
        alert("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("An error occurred while deleting the post")
    }
  }

  const handleModeratePost = async (postId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/moderate/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        fetchFlaggedPosts()
        fetchStats()
      }
    } catch (error) {
      console.error("Error moderating post:", error)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage the platform and moderate content
          </p>
        </div>

        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
                <CardDescription>{stats.totalUsers} users</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Posts</CardTitle>
                <CardDescription>{stats.totalPosts} posts</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  {stats.totalApplications} applications
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flagged Posts</CardTitle>
                <CardDescription>
                  {stats.flaggedPosts} need review
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Flagged Posts</h2>
            </div>
            {flaggedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No flagged posts to review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              flaggedPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>
                          By {post.author.name || "Unknown"}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">{post.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleModeratePost(post.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleModeratePost(post.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">All Posts</h2>
              <Button
                variant="outline"
                onClick={() => setShowAllPosts(!showAllPosts)}
              >
                {showAllPosts ? "Hide" : "Show All Posts"}
              </Button>
            </div>
            {showAllPosts && (
              <>
                {allPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No posts found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  allPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{post.title}</CardTitle>
                            <CardDescription>
                              By {post.author.name || "Unknown"} ({post.author.email})
                              {post.organization && ` • ${post.organization.name}`}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline">{post.category}</Badge>
                            <Badge
                              variant={
                                post.status === "PUBLISHED"
                                  ? "default"
                                  : post.status === "DRAFT"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {post.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {post.applications.length} application(s) • Created{" "}
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete Post
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


