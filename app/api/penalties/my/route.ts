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

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all penalties for the user
    const penalties = await prisma.penalty.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Filter out expired penalties that are still marked as ACTIVE
    const now = new Date()
    const activePenalties = penalties.filter((penalty) => {
      if (penalty.status === "RESOLVED" || penalty.status === "EXPIRED") {
        return false
      }
      if (penalty.expiresAt && new Date(penalty.expiresAt) < now) {
        return false
      }
      return true
    })

    return NextResponse.json({
      active: activePenalties,
      all: penalties,
    })
  } catch (error) {
    console.error("Error fetching penalties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

