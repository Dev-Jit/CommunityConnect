"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BackButton } from "@/components/ui/back-button"

interface ApprovedApplication {
  id: string
  volunteer: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  post: {
    id: string
    title: string
  }
}

interface Certificate {
  id: string
  title: string
  description: string | null
  issuedDate: string
  verified: boolean
  volunteer: {
    name: string | null
    email: string
  }
  post: {
    title: string
  }
}

export default function IssueCertificatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<any[]>([])
  const [selectedPost, setSelectedPost] = useState<string>("")
  const [approvedApplications, setApprovedApplications] = useState<ApprovedApplication[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState<string | null>(null)
  const [issuingAll, setIssuingAll] = useState(false)
  const [certificateForm, setCertificateForm] = useState({
    title: "",
    description: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "ORGANIZATION"
    ) {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchPosts()
      fetchCertificates()
    }
  }, [session, status, router])

  useEffect(() => {
    if (selectedPost) {
      fetchApprovedApplications()
    }
  }, [selectedPost])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts/my")
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchApprovedApplications = async () => {
    try {
      const response = await fetch(`/api/posts/${selectedPost}/applications/approved`)
      const data = await response.json()
      setApprovedApplications(data)
    } catch (error) {
      console.error("Error fetching approved applications:", error)
    }
  }

  const fetchCertificates = async () => {
    try {
      const response = await fetch("/api/certificates")
      const data = await response.json()
      setCertificates(data)
    } catch (error) {
      console.error("Error fetching certificates:", error)
    }
  }

  const handleIssueCertificate = async (volunteerId: string) => {
    if (!certificateForm.title.trim()) {
      alert("Please enter a certificate title")
      return
    }

    setIssuing(volunteerId)
    try {
      const response = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPost,
          volunteerId,
          title: certificateForm.title,
          description: certificateForm.description || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Failed to issue certificate")
        return
      }

      // Reset form and refresh
      setCertificateForm({ title: "", description: "" })
      fetchCertificates()
      fetchApprovedApplications()
      alert("Certificate issued successfully!")
    } catch (error) {
      console.error("Error issuing certificate:", error)
      alert("An error occurred")
    } finally {
      setIssuing(null)
    }
  }

  const handleIssueAllCertificates = async () => {
    if (!selectedPost) {
      alert("Please select an event")
      return
    }
    if (!certificateForm.title.trim()) {
      alert("Please enter a certificate title")
      return
    }

    setIssuingAll(true)
    try {
      const response = await fetch("/api/certificates/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: selectedPost,
          title: certificateForm.title,
          description: certificateForm.description || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data.error || "Failed to issue certificates")
        return
      }

      // Reset form and refresh
      setCertificateForm({ title: "", description: "" })
      fetchCertificates()
      fetchApprovedApplications()

      alert(
        `Certificates issued!\n\nCreated: ${data.created}\nSkipped (already issued): ${data.skippedExisting}\nSkipped (suspended): ${data.skippedPenalty}\nSkipped (not eligible): ${data.skippedNotEligible}`
      )
    } catch (error) {
      console.error("Error issuing all certificates:", error)
      alert("An error occurred")
    } finally {
      setIssuingAll(false)
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

  const selectedPostData = posts.find((p) => p.id === selectedPost)
  const issuedCertificatesForPost = certificates.filter(
    (c) => c.post.id === selectedPost
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BackButton className="mb-4" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Issue Certificates</h1>
          <p className="text-muted-foreground mt-2">
            Issue participation certificates to volunteers who have completed events
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Event</CardTitle>
              <CardDescription>
                Choose an event to issue certificates for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="post">Event</Label>
                  <select
                    id="post"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                    value={selectedPost}
                    onChange={(e) => setSelectedPost(e.target.value)}
                  >
                    <option value="">Select an event...</option>
                    {posts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedPostData && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="font-semibold">{selectedPostData.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPostData.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Certificate Details</CardTitle>
              <CardDescription>
                Set default certificate information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="certTitle">Certificate Title *</Label>
                  <Input
                    id="certTitle"
                    value={certificateForm.title}
                    onChange={(e) =>
                      setCertificateForm({
                        ...certificateForm,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Certificate of Participation"
                  />
                </div>
                <div>
                  <Label htmlFor="certDesc">Description (Optional)</Label>
                  <textarea
                    id="certDesc"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={certificateForm.description}
                    onChange={(e) =>
                      setCertificateForm({
                        ...certificateForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Additional details about the certificate..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {selectedPost && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>
                    Approved Volunteers ({approvedApplications.length})
                  </CardTitle>
                  <CardDescription>
                    Issue certificates to volunteers who participated in this event
                  </CardDescription>
                </div>
                <Button
                  onClick={handleIssueAllCertificates}
                  disabled={issuingAll || approvedApplications.length === 0}
                >
                  {issuingAll ? "Issuing to all..." : "Issue to All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {approvedApplications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No approved volunteers for this event yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {approvedApplications.map((application) => {
                    const hasCertificate = issuedCertificatesForPost.some(
                      (c) => c.volunteer.email === application.volunteer.email
                    )

                    return (
                      <Card key={application.id}>
                        <CardContent className="py-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">
                                {application.volunteer.name || "Volunteer"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {application.volunteer.email}
                              </p>
                            </div>
                            <div className="flex gap-2 items-center">
                              {hasCertificate ? (
                                <Badge variant="default">Certificate Issued</Badge>
                              ) : (
                                <Button
                                  onClick={() =>
                                    handleIssueCertificate(application.volunteer.id)
                                  }
                                  disabled={issuing === application.volunteer.id}
                                >
                                  {issuing === application.volunteer.id
                                    ? "Issuing..."
                                    : "Issue Certificate"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Issued Certificates ({certificates.length})</CardTitle>
            <CardDescription>
              View all certificates you have issued
            </CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No certificates issued yet.
              </p>
            ) : (
              <div className="space-y-4">
                {certificates.map((certificate) => (
                  <Card key={certificate.id}>
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{certificate.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {certificate.volunteer.name} • {certificate.post.title}
                          </p>
                          {certificate.description && (
                            <p className="text-sm mt-2">{certificate.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Issued on {new Date(certificate.issuedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={certificate.verified ? "default" : "secondary"}>
                          {certificate.verified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

