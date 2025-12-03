"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const { data: session } = useSession()

  const getDashboardPath = () => {
    if (!session?.user) return "/"
    const role = (session.user as any).role
    if (role === "ADMIN") return "/admin/dashboard"
    if (role === "ORGANIZATION") return "/organization/dashboard"
    return "/volunteer/dashboard"
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link 
            href={session ? getDashboardPath() : "/"} 
            className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
          >
            CommunityConnect
          </Link>
          <div className="flex gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-2xl h-64 rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=400&fit=crop"
              alt="Community volunteers working together"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">
          Connect with Your Community
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of volunteers making a difference. Find opportunities
          that match your skills and passions.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/posts">
            <Button size="lg" variant="outline">
              Browse Opportunities
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why CommunityConnect?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
              <img
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=300&fit=crop"
                alt="Finding opportunities"
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>Find Opportunities</CardTitle>
              <CardDescription>
                Discover volunteer opportunities near you with our interactive map
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
              <img
                src="https://images.unsplash.com/photo-1509099863731-ef4bff19e808?w=400&h=300&fit=crop"
                alt="Tracking impact"
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>Track Your Impact</CardTitle>
              <CardDescription>
                Keep track of your volunteer hours and contributions
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=300&fit=crop"
                alt="Building connections"
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>Build Connections</CardTitle>
              <CardDescription>
                Connect with organizations and fellow volunteers
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  )
}


