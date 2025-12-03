import { formatDate, formatDistance } from "@/lib/utils"

describe("Utils", () => {
  describe("formatDate", () => {
    it("should format a date string", () => {
      const date = "2024-01-15T00:00:00Z"
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
    })

    it("should format a Date object", () => {
      const date = new Date("2024-01-15")
      const formatted = formatDate(date)
      expect(formatted).toBeTruthy()
    })
  })

  describe("formatDistance", () => {
    it("should format distance in meters for short distances", () => {
      const distance = formatDistance(40.7128, -74.006, 40.713, -74.006)
      expect(distance).toMatch(/\d+m/)
    })

    it("should format distance in kilometers for long distances", () => {
      const distance = formatDistance(40.7128, -74.006, 40.8, -74.1)
      expect(distance).toMatch(/\d+\.\d+km/)
    })
  })
})


