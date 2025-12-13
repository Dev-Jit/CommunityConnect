import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { applicationSchema } from "@/lib/validations"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = applicationSchema.parse(body)

    // Check if user is a volunteer
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (!user || user.role !== "VOLUNTEER") {
      return NextResponse.json(
        { error: "Only volunteers can apply" },
        { status: 403 }
      )
    }

    // Check if user has active penalties that prevent participation
    const activePenalties = await prisma.penalty.findMany({
      where: {
        userId: user.id,
        status: "ACTIVE",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })

    const suspension = activePenalties.find((p) => p.type === "SUSPENSION")
    if (suspension) {
      return NextResponse.json(
        { error: "Your account is suspended. You cannot apply to events." },
        { status: 403 }
      )
    }

    const restriction = activePenalties.find(
      (p) => p.type === "TEMPORARY_RESTRICTION"
    )
    if (restriction) {
      const expiresAt = restriction.expiresAt
        ? new Date(restriction.expiresAt)
        : null
      const expiresMessage = expiresAt
        ? ` until ${expiresAt.toLocaleDateString()}`
        : ""
      return NextResponse.json(
        {
          error: `Your account has temporary restrictions. You cannot apply to events${expiresMessage}.`,
        },
        { status: 403 }
      )
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        volunteerId_postId: {
          volunteerId: user.id,
          postId: validatedData.postId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "Already applied to this post" },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        volunteerId: user.id,
        postId: validatedData.postId,
        message: validatedData.message,
      },
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


