import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const volunteers = await prisma.user.findMany({
      where: {
        role: "VOLUNTEER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        skills: true,
        location: true,
        image: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(volunteers)
  } catch (error) {
    console.error("Error fetching volunteers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


