import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    })

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all applications with attendance data
    const applications = await prisma.application.findMany({
      where: {
        attendanceStatus: {
          in: ["PRESENT", "ABSENT"],
        },
      },
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
            startDate: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        attendanceMarkedAt: "desc",
      },
    })

    // Group by volunteer and calculate absence counts
    const volunteerStats = new Map<
      string,
      {
        volunteer: {
          id: string
          name: string | null
          email: string
          image: string | null
        }
        totalEvents: number
        present: number
        absent: number
        recentAbsences: number
        applications: typeof applications
      }
    >()

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    applications.forEach((app) => {
      const volunteerId = app.volunteerId
      if (!volunteerStats.has(volunteerId)) {
        volunteerStats.set(volunteerId, {
          volunteer: app.volunteer,
          totalEvents: 0,
          present: 0,
          absent: 0,
          recentAbsences: 0,
          applications: [],
        })
      }

      const stats = volunteerStats.get(volunteerId)!
      stats.totalEvents++
      stats.applications.push(app)

      if (app.attendanceStatus === "PRESENT") {
        stats.present++
      } else if (app.attendanceStatus === "ABSENT") {
        stats.absent++
        if (
          app.attendanceMarkedAt &&
          new Date(app.attendanceMarkedAt) >= ninetyDaysAgo
        ) {
          stats.recentAbsences++
        }
      }
    })

    // Convert to array and sort by recent absences
    const attendanceData = Array.from(volunteerStats.values()).sort(
      (a, b) => b.recentAbsences - a.recentAbsences
    )

    return NextResponse.json(attendanceData)
  } catch (error) {
    console.error("Error fetching attendance data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

