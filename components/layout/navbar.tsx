"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navbar() {
  const { data: session } = useSession()

  const getDashboardPath = () => {
    if (!session?.user) return "/dashboard"
    const role = (session.user as any).role
    if (role === "ADMIN") return "/admin/dashboard"
    if (role === "ORGANIZATION") return "/organization/dashboard"
    return "/volunteer/dashboard"
  }

  return (
    <nav className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link 
          href={session ? getDashboardPath() : "/"} 
          className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
        >
          CommunityConnect
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/posts">
            <Button variant="ghost">Browse</Button>
          </Link>
          {session ? (
            <>
              <Link href={getDashboardPath()}>
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={session.user?.image || ""} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {session.user?.name || "User"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


