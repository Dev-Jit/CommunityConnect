"use client"

import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
})

interface Post {
  id: string
  title: string
  description: string
  latitude: number | null
  longitude: number | null
  category: string
  author: {
    name: string | null
  }
}

interface PostMapProps {
  posts: Post[]
  center?: [number, number]
  zoom?: number
  onPostClick?: (post: Post) => void
}

function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13)
    }
  }, [center, zoom, map])
  
  return null
}

export function PostMap({ posts, center, zoom = 13, onPostClick }: PostMapProps) {
  const defaultCenter: [number, number] = center || [40.7128, -74.0060] // NYC default

  const postsWithLocation = posts.filter(
    (post) => post.latitude !== null && post.longitude !== null
  )

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        {postsWithLocation.map((post) => (
          <Marker
            key={post.id}
            position={[post.latitude!, post.longitude!]}
            eventHandlers={{
              click: () => onPostClick?.(post),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.description}
                </p>
                <p className="text-xs mt-1">Category: {post.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}


