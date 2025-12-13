"use client"

import { useState, useEffect } from "react"
import { PostMap } from "@/components/map/post-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/layout/navbar"
import { BackButton } from "@/components/ui/back-button"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface Post {
  id: string
  title: string
  description: string
  category: string
  location: string | null
  latitude: number | null
  longitude: number | null
  tags: string[]
  images: string[]
  createdAt: string
  author: {
    name: string | null
  }
  organization: {
    name: string | null
  } | null
  applications: { id: string }[]
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "map">("list")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [loading, setLoading] = useState(true)

  const categories = [
    "ENVIRONMENT",
    "EDUCATION",
    "HEALTHCARE",
    "COMMUNITY",
    "ANIMALS",
    "ARTS",
    "SPORTS",
    "TECHNOLOGY",
    "OTHER",
  ]

  useEffect(() => {
    fetchPosts()
    getCurrentLocation()
    
    // Refresh posts every 30 seconds to catch newly published posts
    const interval = setInterval(() => {
      fetchPosts()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterPosts()
  }, [search, category, posts])

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams()
      if (category) params.append("category", category)
      if (search) params.append("search", search)
      if (userLocation) {
        params.append("lat", userLocation[0].toString())
        params.append("lng", userLocation[1].toString())
        params.append("radius", "50")
      }

      const response = await fetch(`/api/posts?${params}`, {
        cache: "no-store", // Ensure fresh data
      })
      const data = await response.json()
      setPosts(data)
      setFilteredPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterPosts = () => {
    let filtered = [...posts]

    if (search) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.description.toLowerCase().includes(search.toLowerCase()) ||
          post.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (category) {
      filtered = filtered.filter((post) => post.category === category)
    }

    setFilteredPosts(filtered)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        () => {
          // User denied location access
        }
      )
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <BackButton className="mb-4" />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Volunteer Opportunities</h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
            >
              Map
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {viewMode === "map" ? (
          <PostMap
            posts={filteredPosts}
            center={userLocation || undefined}
            onPostClick={(post) => {
              window.location.href = `/posts/${post.id}`
            }}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const getImageUrl = () => {
                if (post.images && post.images.length > 0 && post.images[0]) {
                  return post.images[0]
                }
                // Default category-based images
                const imageMap: Record<string, string> = {
                  ENVIRONMENT: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=300&fit=crop",
                  EDUCATION: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
                  HEALTHCARE: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
                  COMMUNITY: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=300&fit=crop",
                  ANIMALS: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=400&h=300&fit=crop",
                  ARTS: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop",
                  SPORTS: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=300&fit=crop",
                  TECHNOLOGY: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
                }
                return imageMap[post.category] || imageMap.COMMUNITY
              }

              return (
              <Card key={post.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="relative h-48 w-full">
                  <img
                    src={getImageUrl()}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary/90 text-white">
                      {post.category}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription>
                    {post.organization?.name || post.author.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {post.location && (
                    <p className="text-xs text-muted-foreground mb-2">
                      📍 {post.location}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-4">
                    {post.applications.length} application(s)
                  </p>
                  <Link href={`/posts/${post.id}`}>
                    <Button className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
              )
            })}
          </div>
        )}

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No opportunities found.</p>
          </div>
        )}
      </div>
    </div>
  )
}


