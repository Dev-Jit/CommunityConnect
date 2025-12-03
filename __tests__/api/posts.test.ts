import { POST } from "@/app/api/posts/route"
import { prisma } from "@/lib/prisma"

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe("POST /api/posts", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return 401 if user is not authenticated", async () => {
    const request = new Request("http://localhost/api/posts", {
      method: "POST",
      body: JSON.stringify({
        title: "Test Post",
        description: "Test Description",
        category: "COMMUNITY",
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})


