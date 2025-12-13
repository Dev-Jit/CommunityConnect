"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { BackButton } from "@/components/ui/back-button"

interface Post {
  id: string
  title: string
  description: string
  category: string
  location: string | null
  tags: string[]
  images: string[]
  maxVolunteers: number | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
  }
  organization: {
    name: string | null
    logo: string | null
  } | null
  applications: {
    id: string
    status: string
    volunteer: {
      name: string | null
    }
  }[]
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [applicationMessage, setApplicationMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`)
      const data = await response.json()
      setPost(data)
    } catch (error) {
      console.error("Error fetching post:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!session) {
      router.push("/auth/signin")
      return
    }

    setApplying(true)
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: params.id,
          message: applicationMessage || undefined,
        }),
      })

      if (response.ok) {
        router.push("/volunteer/dashboard")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to apply")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
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

  if (!post.author) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Error loading post data</p>
        </div>
      </div>
    )
  }

  const isAuthor = session && (session.user as any)?.id === post.author?.id
  const hasApplied = post.applications?.some(
    (app) => (session?.user as any)?.id && app.volunteer?.name === session.user?.name
  ) || false

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton className="mb-4" />
        <Card className="overflow-hidden">
          <div className="relative h-64 w-full">
            <img
              src={
                post.images && post.images.length > 0 && post.images[0]
                  ? post.images[0]
                  : post.category === "ENVIRONMENT"
                  ? "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop"
                  : post.category === "EDUCATION"
                  ? "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop"
                  : post.category === "HEALTHCARE"
                  ? "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop"
                  : post.category === "COMMUNITY"
                  ? "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop"
                  : post.category === "ANIMALS"
                  ? "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=800&h=400&fit=crop"
                  : post.category === "ARTS"
                  ? "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop"
                  : post.category === "SPORTS"
                  ? "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=400&fit=crop"
                  : post.category === "TECHNOLOGY"
                  ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop"
                  : "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop"
              }
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary/90 text-white text-lg px-4 py-2">
                {post.category}
              </Badge>
            </div>
          </div>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{post.title}</CardTitle>
                <CardDescription className="mt-2">
                  {post.organization?.name || post.author.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {post.description}
              </p>
            </div>

            {post.location && (
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-muted-foreground">📍 {post.location}</p>
              </div>
            )}

            {post.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {post.maxVolunteers && (
                <div>
                  <h3 className="font-semibold mb-2">Max Volunteers</h3>
                  <p className="text-muted-foreground">
                    {post.maxVolunteers} volunteers
                  </p>
                </div>
              )}
              {post.startDate && (
                <div>
                  <h3 className="font-semibold mb-2">Start Date</h3>
                  <p className="text-muted-foreground">
                    {new Date(post.startDate).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {session && (session.user as any)?.role === "VOLUNTEER" && !isAuthor && !hasApplied && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Apply to this opportunity</h3>
                <div className="space-y-4">
                  <Input
                    placeholder="Optional message..."
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                  />
                  <Button onClick={handleApply} disabled={applying}>
                    {applying ? "Applying..." : "Apply Now"}
                  </Button>
                </div>
              </div>
            )}

            {isAuthor && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Applications ({post.applications.length})</h3>
                <div className="space-y-2">
                  {post.applications.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="py-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{app.volunteer.name}</p>
                            <Badge variant="secondary">{app.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


