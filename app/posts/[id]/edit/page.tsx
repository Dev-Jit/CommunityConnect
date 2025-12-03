"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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

interface Post {
  id: string
  title: string
  description: string
  category: string
  location: string | null
  tags: string[]
  maxVolunteers: number | null
  startDate: string | null
  endDate: string | null
  status: string
  authorId: string
}

export default function EditPostPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "COMMUNITY",
    location: "",
    latitude: null as number | null,
    longitude: null as number | null,
    tags: [] as string[],
    maxVolunteers: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
  })
  const [tagInput, setTagInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (sessionStatus === "authenticated") {
      fetchPost()
    }
  }, [sessionStatus, params.id, router])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`)
      const data = await response.json()

      if (!response.ok || !data) {
        router.push("/organization/dashboard")
        return
      }

      // Check if user owns the post
      if ((session?.user as any)?.id !== data.authorId) {
        router.push("/organization/dashboard")
        return
      }

      setPost(data)
      setFormData({
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location || "",
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        tags: data.tags || [],
        maxVolunteers: data.maxVolunteers?.toString() || "",
        startDate: data.startDate
          ? new Date(data.startDate).toISOString().slice(0, 16)
          : "",
        endDate: data.endDate
          ? new Date(data.endDate).toISOString().slice(0, 16)
          : "",
        status: data.status,
      })
    } catch (error) {
      console.error("Error fetching post:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const formatDateForAPI = (dateString: string) => {
        if (!dateString || dateString.trim() === "") return undefined
        try {
          const date = new Date(dateString)
          if (isNaN(date.getTime())) return undefined
          return date.toISOString()
        } catch {
          return undefined
        }
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location || undefined,
        latitude: formData.latitude || undefined,
        longitude: formData.longitude || undefined,
        tags: formData.tags,
        maxVolunteers:
          formData.maxVolunteers && formData.maxVolunteers.trim() !== ""
            ? (() => {
                const parsed = parseInt(formData.maxVolunteers)
                return isNaN(parsed) ? undefined : parsed
              })()
            : undefined,
        startDate: formatDateForAPI(formData.startDate),
        endDate: formatDateForAPI(formData.endDate),
        images: [],
      }

      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details
            .map((err: any) => {
              const field = err.path && err.path.length > 0 ? err.path.join(".") : "form"
              return `${field}: ${err.message}`
            })
            .join("\n")
          setError(`Validation errors:\n${errorMessages}`)
        } else if (data.error) {
          setError(data.error)
        } else {
          setError("An error occurred. Please check all required fields.")
        }
        return
      }

      router.push(`/posts/${params.id}`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      })
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const geocodeLocation = async () => {
    if (!formData.location || formData.location.trim() === "") {
      setError("Please enter a location first")
      return
    }

    setGeocoding(true)
    setError("")

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.location
        )}&limit=1`
      )

      if (!response.ok) {
        throw new Error("Geocoding failed")
      }

      const data = await response.json()

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lon,
        })
        setError("")
      } else {
        setError("Location not found. Please try a more specific location.")
      }
    } catch (err) {
      setError("Failed to geocode location. You can still save without coordinates.")
    } finally {
      setGeocoding(false)
    }
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }

    setGeocoding(true)
    setError("")

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setGeocoding(false)
      },
      () => {
        setError("Failed to get your location")
        setGeocoding(false)
      }
    )
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      const formatDateForAPI = (dateString: string) => {
        if (!dateString || dateString.trim() === "") return undefined
        try {
          const date = new Date(dateString)
          if (isNaN(date.getTime())) return undefined
          return date.toISOString()
        } catch {
          return undefined
        }
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location || undefined,
        tags: formData.tags,
        maxVolunteers:
          formData.maxVolunteers && formData.maxVolunteers.trim() !== ""
            ? (() => {
                const parsed = parseInt(formData.maxVolunteers)
                return isNaN(parsed) ? undefined : parsed
              })()
            : undefined,
        startDate: formatDateForAPI(formData.startDate),
        endDate: formatDateForAPI(formData.endDate),
        images: [],
        status: "PUBLISHED",
      }

      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push(`/posts/${params.id}`)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to publish post")
      }
    } catch (error) {
      console.error("Error publishing post:", error)
      setError("An error occurred while publishing")
    } finally {
      setSaving(false)
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Edit Post</CardTitle>
                <CardDescription>Update your volunteer opportunity</CardDescription>
              </div>
              <Badge
                variant={
                  formData.status === "PUBLISHED"
                    ? "default"
                    : formData.status === "DRAFT"
                    ? "secondary"
                    : "outline"
                }
              >
                {formData.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="City, State or Address"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={geocodeLocation}
                    disabled={geocoding || !formData.location}
                  >
                    {geocoding ? "..." : "Get Coordinates"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={useCurrentLocation}
                    disabled={geocoding}
                  >
                    Use My Location
                  </Button>
                </div>
                {formData.latitude && formData.longitude && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {formData.latitude.toFixed(4)},{" "}
                    {formData.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" onClick={addTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxVolunteers">Max Volunteers</Label>
                  <Input
                    id="maxVolunteers"
                    type="number"
                    min="1"
                    value={formData.maxVolunteers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxVolunteers: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
                  <p className="text-sm text-destructive whitespace-pre-line">
                    {error}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                {formData.status === "DRAFT" && (
                  <Button type="button" onClick={handlePublish}>
                    Publish Post
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

