import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { postSchema } from "@/lib/validations"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user
      ? await prisma.user.findUnique({
          where: { id: (session.user as any).id },
        })
      : null

    // Non-admin users can only see PUBLISHED posts, except for their own posts
    const where: any = { id: params.id }
    if (!user || user.role !== "ADMIN") {
      // Allow users to see their own posts regardless of status
      if (user?.id) {
        where.OR = [
          { status: "PUBLISHED" },
          { authorId: user.id },
        ]
      } else {
        // Not logged in - only PUBLISHED posts
        where.status = "PUBLISHED"
      }
    }

    const post = await prisma.post.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
          },
        },
        applications: {
          include: {
            volunteer: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Ensure author is included (should always be present due to relation)
    if (!post.author) {
      return NextResponse.json(
        { error: "Post data incomplete" },
        { status: 500 }
      )
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { status, ...postData } = body
    const validatedData = postSchema.parse(postData)

    // Check if user owns the post
    const existingPost = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (existingPost.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const post = await prisma.post.update({
      where: { id: params.id },
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
        status: status || existingPost.status, // Allow status update or keep existing
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

    return NextResponse.json(post)
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if user owns the post or is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (post.authorId !== user?.id && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.post.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Post deleted successfully" })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


