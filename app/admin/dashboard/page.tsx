"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { BackButton } from "@/components/ui/back-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface Stats {
  totalUsers: number
  totalPosts: number
  totalApplications: number
  flaggedPosts: number
}

interface FlaggedPost {
  id: string
  title: string
  status: string
  author: {
    name: string | null
  }
}

interface PendingPost {
  id: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  author: {
    name: string | null
    email: string
  }
  organization: {
    name: string | null
  } | null
  applications: { id: string }[]
}

interface Post {
  id: string
  title: string
  description: string
  status: string
  category: string
  createdAt: string
  author: {
    name: string | null
    email: string
  }
  organization: {
    name: string | null
  } | null
  applications: { id: string }[]
}

interface Penalty {
  id: string
  type: string
  status: string
  reason: string
  description: string | null
  expiresAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface User {
  id: string
  name: string | null
  email: string
  role: string
}

interface AttendanceData {
  volunteer: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  totalEvents: number
  present: number
  absent: number
  recentAbsences: number
  applications: Array<{
    id: string
    attendanceStatus: string
    attendanceMarkedAt: string | null
    post: {
      id: string
      title: string
      category: string
      startDate: string | null
      organization: {
        name: string | null
      } | null
    }
  }>
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([])
  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [penalties, setPenalties] = useState<Penalty[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [showPenalties, setShowPenalties] = useState(false)
  const [showPenaltyForm, setShowPenaltyForm] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)
  const [penaltyForm, setPenaltyForm] = useState({
    userId: "",
    type: "WARNING" as "WARNING" | "TEMPORARY_RESTRICTION" | "SUSPENSION",
    reason: "",
    description: "",
    expiresAt: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    if (status === "authenticated") {
      fetchStats()
      fetchFlaggedPosts()
      fetchPendingPosts()
      fetchAllPosts()
      fetchPenalties()
      fetchUsers()
      fetchAttendance()
    }
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlaggedPosts = async () => {
    try {
      const response = await fetch("/api/admin/flagged-posts")
      const data = await response.json()
      setFlaggedPosts(data)
    } catch (error) {
      console.error("Error fetching flagged posts:", error)
    }
  }

  const fetchPendingPosts = async () => {
    try {
      const response = await fetch("/api/admin/pending-posts")
      const data = await response.json()
      setPendingPosts(data)
    } catch (error) {
      console.error("Error fetching pending posts:", error)
    }
  }

  const fetchAllPosts = async () => {
    try {
      const response = await fetch("/api/admin/posts")
      const data = await response.json()
      setAllPosts(data)
    } catch (error) {
      console.error("Error fetching all posts:", error)
    }
  }

  const fetchPenalties = async () => {
    try {
      const response = await fetch("/api/admin/penalties")
      const data = await response.json()
      setPenalties(data)
    } catch (error) {
      console.error("Error fetching penalties:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const response = await fetch("/api/admin/attendance")
      const data = await response.json()
      setAttendanceData(data)
    } catch (error) {
      console.error("Error fetching attendance:", error)
    }
  }

  const handleApprovePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/approve-post/${postId}`, {
        method: "POST",
      })

      if (response.ok) {
        fetchPendingPosts()
        fetchAllPosts()
        fetchStats()
      } else {
        alert("Failed to approve post")
      }
    } catch (error) {
      console.error("Error approving post:", error)
      alert("An error occurred")
    }
  }

  const handleCreatePenalty = async () => {
    if (!penaltyForm.userId || !penaltyForm.reason) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch("/api/admin/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(penaltyForm),
      })

      if (response.ok) {
        fetchPenalties()
        setShowPenaltyForm(false)
        setPenaltyForm({
          userId: "",
          type: "WARNING",
          reason: "",
          description: "",
          expiresAt: "",
        })
        alert("Penalty created successfully")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create penalty")
      }
    } catch (error) {
      console.error("Error creating penalty:", error)
      alert("An error occurred")
    }
  }

  const handleResolvePenalty = async (penaltyId: string) => {
    try {
      const response = await fetch(`/api/admin/penalties/${penaltyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      })

      if (response.ok) {
        fetchPenalties()
      } else {
        alert("Failed to resolve penalty")
      }
    } catch (error) {
      console.error("Error resolving penalty:", error)
      alert("An error occurred")
    }
  }

  const handleBlockUser = async (userId: string, userName: string) => {
    if (
      !confirm(
        `Are you sure you want to block ${userName} from participating in events? This will create a suspension penalty.`
      )
    ) {
      return
    }

    try {
      const response = await fetch("/api/admin/penalties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          type: "SUSPENSION",
          reason: "Blocked by Admin - Excessive Absences",
          description: "User has been blocked from participating in events due to multiple absences.",
          expiresAt: undefined, // Permanent suspension until manually resolved
        }),
      })

      if (response.ok) {
        fetchPenalties()
        fetchAttendance()
        alert("User has been blocked successfully")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to block user")
      }
    } catch (error) {
      console.error("Error blocking user:", error)
      alert("An error occurred")
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAllPosts()
        fetchFlaggedPosts()
        fetchStats()
      } else {
        alert("Failed to delete post")
      }
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("An error occurred while deleting the post")
    }
  }

  const handleModeratePost = async (postId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/moderate/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        fetchFlaggedPosts()
        fetchStats()
      }
    } catch (error) {
      console.error("Error moderating post:", error)
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage the platform and moderate content
          </p>
        </div>

        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
                <CardDescription>{stats.totalUsers} users</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Posts</CardTitle>
                <CardDescription>{stats.totalPosts} posts</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>
                  {stats.totalApplications} applications
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Flagged Posts</CardTitle>
                <CardDescription>
                  {stats.flaggedPosts} need review
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">
                Pending Approval ({pendingPosts.length})
              </h2>
            </div>
            {pendingPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No posts pending approval.
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>
                          By {post.author.name || "Unknown"} ({post.author.email})
                          {post.organization && ` • ${post.organization.name}`}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{post.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleApprovePost(post.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        Reject
                      </Button>
                      <Link href={`/posts/${post.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Attendance & Absence Management</h2>
              <Button
                variant="outline"
                onClick={() => setShowAttendance(!showAttendance)}
              >
                {showAttendance ? "Hide" : "Show"} Attendance Data
              </Button>
            </div>

            {showAttendance && (
              <>
                {attendanceData.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No attendance data available yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {attendanceData
                      .filter((data) => data.absent > 0)
                      .map((data) => {
                        const hasActiveSuspension = penalties.some(
                          (p) =>
                            p.userId === data.volunteer.id &&
                            p.type === "SUSPENSION" &&
                            p.status === "ACTIVE" &&
                            (!p.expiresAt || new Date(p.expiresAt) > new Date())
                        )

                        return (
                          <Card key={data.volunteer.id}>
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <CardTitle>
                                      {data.volunteer.name || data.volunteer.email}
                                    </CardTitle>
                                    <CardDescription>
                                      {data.volunteer.email}
                                    </CardDescription>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="default">
                                    {data.present} Present
                                  </Badge>
                                  <Badge variant="destructive">
                                    {data.absent} Absent
                                  </Badge>
                                  <Badge variant="secondary">
                                    {data.recentAbsences} Recent (90 days)
                                  </Badge>
                                  {hasActiveSuspension && (
                                    <Badge variant="destructive">BLOCKED</Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 mb-4">
                                <p className="text-sm">
                                  <strong>Total Events:</strong> {data.totalEvents} |{" "}
                                  <strong>Present:</strong> {data.present} |{" "}
                                  <strong>Absent:</strong> {data.absent}
                                </p>
                                {data.recentAbsences > 0 && (
                                  <p className="text-sm text-destructive">
                                    <strong>Warning:</strong> {data.recentAbsences}{" "}
                                    absences in the last 90 days
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2 mb-4">
                                <p className="text-sm font-semibold">
                                  Recent Absences:
                                </p>
                                {data.applications
                                  .filter((app) => app.attendanceStatus === "ABSENT")
                                  .slice(0, 5)
                                  .map((app) => (
                                    <div
                                      key={app.id}
                                      className="text-sm text-muted-foreground p-2 bg-muted rounded"
                                    >
                                      <strong>{app.post.title}</strong> -{" "}
                                      {app.post.organization?.name || "Unknown Org"} -{" "}
                                      {app.attendanceMarkedAt
                                        ? new Date(
                                            app.attendanceMarkedAt
                                          ).toLocaleDateString()
                                        : "Unknown date"}
                                    </div>
                                  ))}
                              </div>

                              <div className="flex gap-2">
                                {!hasActiveSuspension && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setPenaltyForm({
                                          userId: data.volunteer.id,
                                          type: "WARNING",
                                          reason: "Multiple Absences",
                                          description: `User has ${data.recentAbsences} absences in the last 90 days.`,
                                          expiresAt: "",
                                        })
                                        setShowPenaltyForm(true)
                                        setShowAttendance(false)
                                      }}
                                    >
                                      Issue Warning
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setPenaltyForm({
                                          userId: data.volunteer.id,
                                          type: "TEMPORARY_RESTRICTION",
                                          reason: "Excessive Absences",
                                          description: `User has ${data.recentAbsences} absences. Temporary restriction applied.`,
                                          expiresAt: new Date(
                                            Date.now() + 30 * 24 * 60 * 60 * 1000
                                          ).toISOString().slice(0, 16),
                                        })
                                        setShowPenaltyForm(true)
                                        setShowAttendance(false)
                                      }}
                                    >
                                      Temporary Restriction
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        handleBlockUser(
                                          data.volunteer.id,
                                          data.volunteer.name || data.volunteer.email
                                        )
                                      }
                                    >
                                      Block User
                                    </Button>
                                  </>
                                )}
                                {hasActiveSuspension && (
                                  <Badge variant="destructive" className="px-3 py-1">
                                    User is currently blocked
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Flagged Posts</h2>
            </div>
            {flaggedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No flagged posts to review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              flaggedPosts.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>
                          By {post.author.name || "Unknown"}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">{post.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleModeratePost(post.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleModeratePost(post.id, "delete")}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Penalty Management</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPenalties(!showPenalties)}
                >
                  {showPenalties ? "Hide" : "Show"} Penalties
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowPenaltyForm(!showPenaltyForm)}
                >
                  {showPenaltyForm ? "Cancel" : "Create Penalty"}
                </Button>
              </div>
            </div>

            {showPenaltyForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Penalty</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="penaltyUser">User</Label>
                      <select
                        id="penaltyUser"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                        value={penaltyForm.userId}
                        onChange={(e) =>
                          setPenaltyForm({ ...penaltyForm, userId: e.target.value })
                        }
                      >
                        <option value="">Select a user...</option>
                        {users
                          .filter((u) => u.role === "VOLUNTEER")
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.email}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="penaltyType">Penalty Type</Label>
                      <select
                        id="penaltyType"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                        value={penaltyForm.type}
                        onChange={(e) =>
                          setPenaltyForm({
                            ...penaltyForm,
                            type: e.target.value as any,
                          })
                        }
                      >
                        <option value="WARNING">Warning</option>
                        <option value="TEMPORARY_RESTRICTION">
                          Temporary Restriction
                        </option>
                        <option value="SUSPENSION">Suspension</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="penaltyReason">Reason *</Label>
                      <Input
                        id="penaltyReason"
                        value={penaltyForm.reason}
                        onChange={(e) =>
                          setPenaltyForm({ ...penaltyForm, reason: e.target.value })
                        }
                        placeholder="Reason for penalty"
                      />
                    </div>
                    <div>
                      <Label htmlFor="penaltyDesc">Description</Label>
                      <textarea
                        id="penaltyDesc"
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={penaltyForm.description}
                        onChange={(e) =>
                          setPenaltyForm({
                            ...penaltyForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Additional details..."
                      />
                    </div>
                    {(penaltyForm.type === "TEMPORARY_RESTRICTION" ||
                      penaltyForm.type === "SUSPENSION") && (
                      <div>
                        <Label htmlFor="penaltyExpires">Expires At</Label>
                        <Input
                          id="penaltyExpires"
                          type="datetime-local"
                          value={penaltyForm.expiresAt}
                          onChange={(e) =>
                            setPenaltyForm({
                              ...penaltyForm,
                              expiresAt: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                    <Button onClick={handleCreatePenalty}>Create Penalty</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {showPenalties && (
              <>
                {penalties.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        No penalties issued yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  penalties.map((penalty) => (
                    <Card key={penalty.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>
                              {penalty.user.name || penalty.user.email}
                            </CardTitle>
                            <CardDescription>{penalty.reason}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant={
                                penalty.type === "SUSPENSION"
                                  ? "destructive"
                                  : penalty.type === "TEMPORARY_RESTRICTION"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {penalty.type.replace("_", " ")}
                            </Badge>
                            <Badge
                              variant={
                                penalty.status === "ACTIVE"
                                  ? "default"
                                  : penalty.status === "RESOLVED"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {penalty.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {penalty.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {penalty.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(penalty.createdAt).toLocaleDateString()}
                            {penalty.expiresAt &&
                              ` • Expires: ${new Date(penalty.expiresAt).toLocaleDateString()}`}
                          </p>
                          {penalty.status === "ACTIVE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolvePenalty(penalty.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">All Posts</h2>
              <Button
                variant="outline"
                onClick={() => setShowAllPosts(!showAllPosts)}
              >
                {showAllPosts ? "Hide" : "Show All Posts"}
              </Button>
            </div>
            {showAllPosts && (
              <>
                {allPosts.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No posts found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  allPosts.map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{post.title}</CardTitle>
                            <CardDescription>
                              By {post.author.name || "Unknown"} ({post.author.email})
                              {post.organization && ` • ${post.organization.name}`}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline">{post.category}</Badge>
                            <Badge
                              variant={
                                post.status === "PUBLISHED"
                                  ? "default"
                                  : post.status === "DRAFT"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {post.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {post.applications.length} application(s) • Created{" "}
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                          >
                            Delete Post
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


