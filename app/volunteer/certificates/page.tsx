"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/ui/back-button"

interface Certificate {
  id: string
  title: string
  description: string | null
  issuedDate: string
  verified: boolean
  certificateUrl: string | null
  post: {
    id: string
    title: string
    category: string
  }
  organization: {
    name: string | null
    logo: string | null
  } | null
}

export default function VolunteerCertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "VOLUNTEER"
    ) {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchCertificates()
    }
  }, [session, status, router])

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/certificates", {
        cache: "no-store",
      })
      const data = await response.json()
      setCertificates(data)
    } catch (error) {
      console.error("Error fetching certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (certificate: Certificate) => {
    // In production, this would download the actual certificate PDF
    // For now, we'll create a simple certificate display
    const certificateWindow = window.open("", "_blank")
    if (certificateWindow) {
      certificateWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${certificate.title}</title>
            <style>
              body {
                font-family: 'Times New Roman', serif;
                text-align: center;
                padding: 50px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .certificate {
                background: white;
                padding: 60px;
                border: 10px solid #00ADB5;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                max-width: 800px;
              }
              h1 { color: #222831; font-size: 36px; margin-bottom: 20px; }
              h2 { color: #00ADB5; font-size: 24px; margin: 30px 0; }
              p { color: #393E46; font-size: 18px; line-height: 1.6; }
              .date { margin-top: 40px; color: #666; }
            </style>
          </head>
          <body>
            <div class="certificate">
              <h1>CERTIFICATE OF PARTICIPATION</h1>
              <h2>${certificate.title}</h2>
              <p>This is to certify that</p>
              <h2 style="text-decoration: underline;">${session?.user?.name || "Volunteer"}</h2>
              <p>has successfully participated in</p>
              <h2>${certificate.post.title}</h2>
              ${certificate.description ? `<p>${certificate.description}</p>` : ""}
              ${certificate.organization ? `<p>Issued by ${certificate.organization.name}</p>` : ""}
              <p class="date">Date: ${new Date(certificate.issuedDate).toLocaleDateString()}</p>
            </div>
          </body>
        </html>
      `)
      certificateWindow.document.close()
      setTimeout(() => {
        certificateWindow.print()
      }, 250)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton className="mb-4" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-muted-foreground mt-2">
            View your participation certificates
          </p>
        </div>

        {certificates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                You don't have any certificates yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Certificates are issued by organizations after you participate in events.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="overflow-hidden">
                <div className="relative h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl opacity-20">🏆</div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant={certificate.verified ? "default" : "secondary"}>
                      {certificate.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{certificate.title}</CardTitle>
                  <CardDescription>
                    {certificate.post.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {certificate.organization && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Issued by {certificate.organization.name}
                    </p>
                  )}
                  {certificate.description && (
                    <p className="text-sm mb-4 line-clamp-2">
                      {certificate.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mb-4">
                    Issued on {new Date(certificate.issuedDate).toLocaleDateString()}
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => handleDownload(certificate)}
                  >
                    View/Print Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

