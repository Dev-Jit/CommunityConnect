import { z } from "zod"

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["VOLUNTEER", "ORGANIZATION"]),
})

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "ENVIRONMENT",
    "EDUCATION",
    "HEALTHCARE",
    "COMMUNITY",
    "ANIMALS",
    "ARTS",
    "SPORTS",
    "TECHNOLOGY",
    "OTHER",
  ]),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  tags: z.array(z.string()).default([]),
  maxVolunteers: z.number().int().positive().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  images: z.array(z.string()).default([]),
}).refine((data) => {
  // If endDate is provided, it should be after startDate
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate)
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const applicationSchema = z.object({
  postId: z.string(),
  message: z.string().optional(),
})

export const profileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  skills: z.array(z.string()).optional(),
})


