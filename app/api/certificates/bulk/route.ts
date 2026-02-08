import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bulkSchema = z.object({
  postId: z.string(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  certificateUrl: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = bulkSchema.parse(body)

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

    const post = await prisma.post.findUnique({
      where: { id: validated.postId },
      select: { id: true, authorId: true },
    })

    if (!post || post.authorId !== user.id) {
      return NextResponse.json(
        { error: "Post not found or you don't own this post" },
        { status: 404 }
      )
    }

    // Get all eligible volunteers: APPROVED + PRESENT
    const eligibleApplications = await prisma.application.findMany({
      where: {
        postId: validated.postId,
        status: "APPROVED",
        attendanceStatus: "PRESENT",
      },
      select: { volunteerId: true },
    })

    const volunteerIds = Array.from(
      new Set(eligibleApplications.map((a) => a.volunteerId))
    )

    if (volunteerIds.length === 0) {
      return NextResponse.json({
        created: 0,
        skippedExisting: 0,
        skippedPenalty: 0,
        skippedNotEligible: 0,
      })
    }

    // Existing certificates for this post
    const existing = await prisma.certificate.findMany({
      where: {
        postId: validated.postId,
        volunteerId: { in: volunteerIds },
      },
      select: { volunteerId: true },
    })
    const existingSet = new Set(existing.map((c) => c.volunteerId))

    // Active SUSPENSION penalties (match single-issue behavior which blocks suspensions)
    const suspensions = await prisma.penalty.findMany({
      where: {
        userId: { in: volunteerIds },
        status: "ACTIVE",
        type: "SUSPENSION",
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { userId: true },
    })
    const suspendedSet = new Set(suspensions.map((p) => p.userId))

    const toCreate = volunteerIds.filter(
      (id) => !existingSet.has(id) && !suspendedSet.has(id)
    )

    const created = await prisma.$transaction(
      toCreate.map((volunteerId) =>
        prisma.certificate.create({
          data: {
            title: validated.title,
            description: validated.description || null,
            certificateUrl: validated.certificateUrl || null,
            volunteerId,
            postId: validated.postId,
            organizationId: user.organization?.id || null,
          },
          select: { id: true },
        })
      )
    )

    return NextResponse.json({
      created: created.length,
      skippedExisting: existingSet.size,
      skippedPenalty: suspendedSet.size,
      skippedNotEligible: 0,
    })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error bulk issuing certificates:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


