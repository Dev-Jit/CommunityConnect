"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Post {
  id: string
  title: string
  description: string
  status: string
  category: string
  images: string[]
  createdAt: string
  applications: {
    id: string
    status: string
    volunteer: {
      name: string | null
    }
  }[]
}

export default function OrganizationDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "ORGANIZATION"
    ) {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchPosts()
    }
  }, [session, status, router])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts/my", {
        cache: "no-store",
      })
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
      })

      if (response.ok) {
        fetchPosts() // Refresh the list
      } else {
        alert("Failed to publish post")
      }
    } catch (error) {
      console.error("Error publishing post:", error)
      alert("An error occurred")
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
        fetchPosts() // Refresh the list
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("An error occurred while deleting the post")
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

  const totalApplications = posts.reduce(
    (sum, post) => sum + post.applications.length,
    0
  )
  const pendingApplications = posts.reduce(
    (sum, post) =>
      sum + post.applications.filter((a) => a.status === "PENDING").length,
    0
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Organization Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your volunteer opportunities
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/posts/new">
              <Button>Create Post</Button>
            </Link>
            <Link href="/organization/certificates">
              <Button variant="outline">Issue Certificates</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Posts</CardTitle>
              <CardDescription>{posts.length} posts</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>{totalApplications} total</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending</CardTitle>
              <CardDescription>{pendingApplications} pending</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">My Posts</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven't created any posts yet.
                </p>
                <Link href="/posts/new">
                  <Button>Create Your First Post</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => {
              const getImageUrl = () => {
                if (post.images && post.images.length > 0 && post.images[0]) {
                  return post.images[0]
                }
                // Default category-based images
                const imageMap: Record<string, string> = {
                  ENVIRONMENT: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=200&fit=crop",
                  EDUCATION: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop",
                  HEALTHCARE: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop",
                  COMMUNITY: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=200&fit=crop",
                  ANIMALS: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=200&fit=crop",
                  ARTS: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=200&fit=crop",
                  SPORTS: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=200&fit=crop",
                  TECHNOLOGY: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop",
                }
                return imageMap[post.category] || imageMap.COMMUNITY
              }

              return (
              <Card key={post.id} className="overflow-hidden">
                <div className="relative h-40 w-full">
                  <img
                    src={getImageUrl()}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={
                        post.status === "PUBLISHED"
                          ? "default"
                          : post.status === "PENDING_APPROVAL"
                          ? "secondary"
                          : post.status === "DRAFT"
                          ? "outline"
                          : "destructive"
                      }
                    >
                      {post.status === "PENDING_APPROVAL" ? "PENDING APPROVAL" : post.status}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{post.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {post.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Badge variant="outline">{post.category}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {post.applications.length} application(s)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {post.status === "DRAFT" && (
                        <Button
                          variant="default"
                          onClick={() => handlePublish(post.id)}
                        >
                          Submit for Approval
                        </Button>
                      )}
                      {post.status === "PENDING_APPROVAL" && (
                        <Badge variant="secondary" className="px-3 py-1">
                          Awaiting Admin Approval
                        </Badge>
                      )}
                      {post.status === "PUBLISHED" && (
                        <>
                          <Link href={`/posts/${post.id}/applications`}>
                            <Button variant="outline">View Applications</Button>
                          </Link>
                          <Link href={`/posts/${post.id}/edit`}>
                            <Button variant="outline">Edit</Button>
                          </Link>
                        </>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}


