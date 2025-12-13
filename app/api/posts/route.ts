import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { postSchema } from "@/lib/validations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const search = searchParams.get("search")
    const lat = searchParams.get("lat")
    const lng = searchParams.get("lng")
    const radius = searchParams.get("radius") || "50" // km

    const where: any = {
      status: "PUBLISHED",
    }

    if (category) {
      where.category = category
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ]
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        applications: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Increased limit
    })

    // Filter by location if provided
    let filteredPosts = posts
    if (lat && lng) {
      const latNum = parseFloat(lat)
      const lngNum = parseFloat(lng)
      const radiusNum = parseFloat(radius)

      filteredPosts = posts.filter((post) => {
        if (!post.latitude || !post.longitude) return false
        const distance = calculateDistance(
          latNum,
          lngNum,
          post.latitude,
          post.longitude
        )
        return distance <= radiusNum
      })
    }

    return NextResponse.json(filteredPosts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = postSchema.parse(body)

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { organization: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If organization, set status to PENDING_APPROVAL, otherwise PUBLISHED
    const postStatus = user.role === "ORGANIZATION" ? "PENDING_APPROVAL" : "PUBLISHED"

    const post = await prisma.post.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        location: validatedData.location || null,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
        tags: validatedData.tags || [],
        maxVolunteers: validatedData.maxVolunteers || null,
        images: validatedData.images || [],
        status: postStatus,
        authorId: user.id,
        organizationId: user.organization?.id || null,
        startDate: validatedData.startDate
          ? new Date(validatedData.startDate)
          : null,
        endDate: validatedData.endDate
          ? new Date(validatedData.endDate)
          : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}


