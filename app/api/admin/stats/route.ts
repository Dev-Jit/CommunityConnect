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

    const [totalUsers, totalPosts, totalApplications, flaggedPosts] =
      await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.application.count(),
        prisma.post.count({ where: { status: "FLAGGED" } }),
      ])

    return NextResponse.json({
      totalUsers,
      totalPosts,
      totalApplications,
      flaggedPosts,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


