import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@communityconnect.com" },
    update: {},
    create: {
      email: "admin@communityconnect.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      bio: "Platform administrator",
    },
  })

  // Create volunteer users
  const volunteerPassword = await bcrypt.hash("volunteer123", 10)
  const volunteer1 = await prisma.user.upsert({
    where: { email: "volunteer1@example.com" },
    update: {},
    create: {
      email: "volunteer1@example.com",
      name: "John Doe",
      password: volunteerPassword,
      role: "VOLUNTEER",
      bio: "Passionate about community service",
      skills: ["Teaching", "Event Planning", "Communication"],
      location: "New York, NY",
      latitude: 40.7128,
      longitude: -74.006,
    },
  })

  const volunteer2 = await prisma.user.upsert({
    where: { email: "volunteer2@example.com" },
    update: {},
    create: {
      email: "volunteer2@example.com",
      name: "Jane Smith",
      password: volunteerPassword,
      role: "VOLUNTEER",
      bio: "Environmental activist and educator",
      skills: ["Environmental Science", "Public Speaking", "Research"],
      location: "Los Angeles, CA",
      latitude: 34.0522,
      longitude: -118.2437,
    },
  })

  // Create organization users
  const orgPassword = await bcrypt.hash("org123", 10)
  const orgUser1 = await prisma.user.upsert({
    where: { email: "org1@example.com" },
    update: {},
    create: {
      email: "org1@example.com",
      name: "Green Earth Foundation",
      password: orgPassword,
      role: "ORGANIZATION",
    },
  })

  const organization1 = await prisma.organization.upsert({
    where: { userId: orgUser1.id },
    update: {},
    create: {
      userId: orgUser1.id,
      name: "Green Earth Foundation",
      description: "Dedicated to environmental conservation and education",
      website: "https://greenearth.org",
      location: "San Francisco, CA",
      latitude: 37.7749,
      longitude: -122.4194,
      verified: true,
    },
  })

  const orgUser2 = await prisma.user.upsert({
    where: { email: "org2@example.com" },
    update: {},
    create: {
      email: "org2@example.com",
      name: "Community Learning Center",
      password: orgPassword,
      role: "ORGANIZATION",
    },
  })

  const organization2 = await prisma.organization.upsert({
    where: { userId: orgUser2.id },
    update: {},
    create: {
      userId: orgUser2.id,
      name: "Community Learning Center",
      description: "Providing educational opportunities for all",
      website: "https://communitylearning.org",
      location: "Chicago, IL",
      latitude: 41.8781,
      longitude: -87.6298,
      verified: true,
    },
  })

  // Create posts
  const post1 = await prisma.post.create({
    data: {
      title: "Beach Cleanup Day",
      description:
        "Join us for a community beach cleanup to help protect our oceans and marine life. We'll provide all necessary equipment. All ages welcome!",
      category: "ENVIRONMENT",
      status: "PUBLISHED",
      location: "Santa Monica Beach, CA",
      latitude: 34.0089,
      longitude: -118.4973,
      tags: ["Environment", "Community", "Outdoor"],
      maxVolunteers: 50,
      startDate: new Date("2024-06-15T09:00:00Z"),
      endDate: new Date("2024-06-15T14:00:00Z"),
      authorId: orgUser1.id,
      organizationId: organization1.id,
    },
  })

  const post2 = await prisma.post.create({
    data: {
      title: "Tutoring Program for Kids",
      description:
        "Help children with their homework and provide academic support. We're looking for volunteers with teaching experience or a passion for education.",
      category: "EDUCATION",
      status: "PUBLISHED",
      location: "Community Learning Center, Chicago",
      latitude: 41.8781,
      longitude: -87.6298,
      tags: ["Education", "Children", "Tutoring"],
      maxVolunteers: 20,
      startDate: new Date("2024-05-01T15:00:00Z"),
      authorId: orgUser2.id,
      organizationId: organization2.id,
    },
  })

  const post3 = await prisma.post.create({
    data: {
      title: "Food Bank Distribution",
      description:
        "Assist with food distribution to families in need. Help sort, pack, and distribute food items. Physical activity involved.",
      category: "COMMUNITY",
      status: "PUBLISHED",
      location: "New York Food Bank, NY",
      latitude: 40.7128,
      longitude: -74.006,
      tags: ["Community", "Food", "Service"],
      maxVolunteers: 30,
      authorId: volunteer1.id,
    },
  })

  // Create applications
  await prisma.application.create({
    data: {
      volunteerId: volunteer1.id,
      postId: post1.id,
      status: "APPROVED",
      message: "Excited to help with the beach cleanup!",
    },
  })

  await prisma.application.create({
    data: {
      volunteerId: volunteer2.id,
      postId: post2.id,
      status: "PENDING",
      message: "I have teaching experience and would love to help!",
    },
  })

  console.log("Database seeded successfully!")
  console.log("Admin: admin@communityconnect.com / admin123")
  console.log("Volunteer: volunteer1@example.com / volunteer123")
  console.log("Organization: org1@example.com / org123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


