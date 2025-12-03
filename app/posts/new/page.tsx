"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function NewPostPage() {
  const router = useRouter()
  const { data: session } = useSession()
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
    imageUrl: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Convert datetime-local to ISO 8601 format
      const formatDateForAPI = (dateString: string) => {
        if (!dateString || dateString.trim() === "") return undefined
        try {
          // datetime-local format: "2024-06-15T09:00"
          // Convert to ISO 8601: "2024-06-15T09:00:00Z"
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
        maxVolunteers: formData.maxVolunteers && formData.maxVolunteers.trim() !== ""
          ? (() => {
              const parsed = parseInt(formData.maxVolunteers)
              return isNaN(parsed) ? undefined : parsed
            })()
          : undefined,
        startDate: formatDateForAPI(formData.startDate),
        endDate: formatDateForAPI(formData.endDate),
        images: formData.imageUrl ? [formData.imageUrl] : [],
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => {
            const field = err.path && err.path.length > 0 ? err.path.join('.') : 'form'
            return `${field}: ${err.message}`
          }).join('\n')
          setError(`Validation errors:\n${errorMessages}`)
        } else if (data.error) {
          setError(data.error)
        } else {
          setError("An error occurred. Please check all required fields.")
        }
        return
      }

      router.push(`/posts/${data.id}`)
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
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
      // Use OpenStreetMap Nominatim API (free, no API key required)
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
      setError("Failed to geocode location. You can still create the post without coordinates.")
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid image file (JPEG, PNG, WebP, or GIF)")
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload file
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      setFormData({
        ...formData,
        imageUrl: data.url,
      })
    } catch (err: any) {
      setError(err.message || "Failed to upload image")
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setFormData({
      ...formData,
      imageUrl: "",
    })
    setImagePreview(null)
  }

  const getDefaultImageUrl = (category: string) => {
    const imageMap: Record<string, string> = {
      ENVIRONMENT: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=400&fit=crop",
      EDUCATION: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
      HEALTHCARE: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop",
      COMMUNITY: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop",
      ANIMALS: "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=800&h=400&fit=crop",
      ARTS: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop",
      SPORTS: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&h=400&fit=crop",
      TECHNOLOGY: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop",
    }
    return imageMap[category] || imageMap.COMMUNITY
  }

  if (!session) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Please sign in to create a post.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
            <CardDescription>
              Share a volunteer opportunity with the community
            </CardDescription>
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
                <Label htmlFor="image">Post Image (Optional)</Label>
                <div className="space-y-4">
                  {imagePreview || formData.imageUrl ? (
                    <div className="relative">
                      <img
                        src={imagePreview || formData.imageUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-md p-8 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        No image selected. A default image will be used based on category.
                      </p>
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        {uploading ? "Uploading..." : "Choose Image"}
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                  {!imagePreview && !formData.imageUrl && (
                    <label
                      htmlFor="image-upload-alt"
                      className="block text-center"
                    >
                      <span className="text-sm text-muted-foreground cursor-pointer hover:text-primary">
                        Or click here to upload
                      </span>
                      <input
                        id="image-upload-alt"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
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
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Post"}
                </Button>
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


