import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const certificateSchema = z.object({
  postId: z.string(),
  volunteerId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  certificateUrl: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Volunteers see their own certificates, organizations see certificates they issued
    const where: any = {}
    if (user.role === "VOLUNTEER") {
      where.volunteerId = user.id
    } else if (user.role === "ORGANIZATION") {
      const org = await prisma.organization.findUnique({
        where: { userId: user.id },
      })
      if (org) {
        where.organizationId = org.id
      } else {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }
    } else {
      // Admin can see all
      where.volunteerId = undefined
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
            category: true,
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
      orderBy: {
        issuedDate: "desc",
      },
    })

    return NextResponse.json(certificates)
  } catch (error) {
    console.error("Error fetching certificates:", error)
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
    const validatedData = certificateSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { organization: true },
    })

    if (!user || user.role !== "ORGANIZATION") {
      return NextResponse.json(
        { error: "Only organizations can issue certificates" },
        { status: 403 }
      )
    }

    // Verify the post belongs to the organization
    const post = await prisma.post.findUnique({
      where: { id: validatedData.postId },
    })

    if (!post || post.authorId !== user.id) {
      return NextResponse.json(
        { error: "Post not found or you don't own this post" },
        { status: 404 }
      )
    }

    // Verify the volunteer has an approved application with PRESENT attendance
    const application = await prisma.application.findUnique({
      where: {
        volunteerId_postId: {
          volunteerId: validatedData.volunteerId,
          postId: validatedData.postId,
        },
      },
    })

    if (!application || application.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Volunteer must have an approved application" },
        { status: 400 }
      )
    }

    // Check attendance - only issue certificate if marked as PRESENT
    if (application.attendanceStatus !== "PRESENT") {
      return NextResponse.json(
        { error: "Certificate can only be issued to volunteers who attended the event" },
        { status: 400 }
      )
    }

    // Check if user has active penalties that prevent certificate issuance
    const activePenalties = await prisma.penalty.findMany({
      where: {
        userId: validatedData.volunteerId,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    if (activePenalties.some(p => p.type === "SUSPENSION")) {
      return NextResponse.json(
        { error: "Cannot issue certificate to suspended user" },
        { status: 403 }
      )
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: {
        volunteerId: validatedData.volunteerId,
        postId: validatedData.postId,
      },
    })

    if (existingCert) {
      return NextResponse.json(
        { error: "Certificate already issued for this volunteer and post" },
        { status: 400 }
      )
    }

    // Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        certificateUrl: validatedData.certificateUrl || null,
        volunteerId: validatedData.volunteerId,
        postId: validatedData.postId,
        organizationId: user.organization?.id || null,
      },
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        organization: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(certificate, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating certificate:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

