"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Volunteer {
  id: string
  name: string | null
  email: string
  bio: string | null
  skills: string[]
  location: string | null
  image: string | null
}

export function VolunteerDirectory() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [filteredVolunteers, setFilteredVolunteers] = useState<Volunteer[]>([])
  const [search, setSearch] = useState("")
  const [skillFilter, setSkillFilter] = useState("")

  useEffect(() => {
    fetchVolunteers()
  }, [])

  useEffect(() => {
    filterVolunteers()
  }, [search, skillFilter, volunteers])

  const fetchVolunteers = async () => {
    try {
      const response = await fetch("/api/volunteers")
      const data = await response.json()
      setVolunteers(data)
      setFilteredVolunteers(data)
    } catch (error) {
      console.error("Error fetching volunteers:", error)
    }
  }

  const filterVolunteers = () => {
    let filtered = [...volunteers]

    if (search) {
      filtered = filtered.filter(
        (volunteer) =>
          volunteer.name?.toLowerCase().includes(search.toLowerCase()) ||
          volunteer.bio?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (skillFilter) {
      filtered = filtered.filter((volunteer) =>
        volunteer.skills.some((skill) =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      )
    }

    setFilteredVolunteers(filtered)
  }

  const allSkills = Array.from(
    new Set(volunteers.flatMap((v) => v.skills))
  ).sort()

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input
          placeholder="Search volunteers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Skills</option>
          {allSkills.map((skill) => (
            <option key={skill} value={skill}>
              {skill}
            </option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVolunteers.map((volunteer) => (
          <Card key={volunteer.id}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={volunteer.image || ""} />
                  <AvatarFallback>
                    {volunteer.name?.charAt(0) || "V"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{volunteer.name || "Volunteer"}</CardTitle>
                  <CardDescription>{volunteer.location || "No location"}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {volunteer.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {volunteer.bio}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {volunteer.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVolunteers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No volunteers found.</p>
        </div>
      )}
    </div>
  )
}


