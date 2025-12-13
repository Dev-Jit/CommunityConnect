import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const attendanceSchema = z.object({
  attendanceStatus: z.enum(["PRESENT", "ABSENT", "NOT_MARKED"]),
})

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
    const validatedData = attendanceSchema.parse(body)

    // Get application and verify post ownership
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        post: {
          select: {
            authorId: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Verify user owns the post
    if (application.post.authorId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update attendance
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        attendanceStatus: validatedData.attendanceStatus,
        attendanceMarkedAt: validatedData.attendanceStatus !== "NOT_MARKED" 
          ? new Date() 
          : null,
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
      },
    })

    // If marked as ABSENT, check if penalty should be applied
    if (validatedData.attendanceStatus === "ABSENT") {
      // Count recent absences for this volunteer
      const recentAbsences = await prisma.application.count({
        where: {
          volunteerId: application.volunteerId,
          attendanceStatus: "ABSENT",
          attendanceMarkedAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      })

      // Auto-apply penalties based on absence count
      // 3 absences = warning, 5 = temporary restriction, 7+ = suspension
      if (recentAbsences === 3) {
        // Create warning penalty
        await prisma.penalty.create({
          data: {
            type: "WARNING",
            status: "ACTIVE",
            reason: "Multiple Absences",
            description: `You have been marked absent ${recentAbsences} times in the last 90 days.`,
            userId: application.volunteerId,
          },
        })
      } else if (recentAbsences === 5) {
        // Create temporary restriction
        await prisma.penalty.create({
          data: {
            type: "TEMPORARY_RESTRICTION",
            status: "ACTIVE",
            reason: "Excessive Absences",
            description: `You have been marked absent ${recentAbsences} times. Temporary restrictions applied.`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            userId: application.volunteerId,
          },
        })
      } else if (recentAbsences >= 7) {
        // Create suspension
        await prisma.penalty.create({
          data: {
            type: "SUSPENSION",
            status: "ACTIVE",
            reason: "Excessive Absences",
            description: `You have been marked absent ${recentAbsences} times. Account suspended.`,
            expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            userId: application.volunteerId,
          },
        })
      }
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

