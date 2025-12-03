# Components Documentation

This document describes the reusable UI components and their usage.

## UI Primitives

Located in `components/ui/`, these are base components built with Radix UI and Tailwind CSS.

### Button

A versatile button component with multiple variants and sizes.

```tsx
import { Button } from "@/components/ui/button"

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

**Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`  
**Sizes**: `default`, `sm`, `lg`, `icon`

### Input

Text input field with consistent styling.

```tsx
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="Email" />
<Input type="password" />
```

### Card

Container component for content sections.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Badge

Small label component for tags and status indicators.

```tsx
import { Badge } from "@/components/ui/badge"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Label

Form label component.

```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="email">Email Address</Label>
```

### Avatar

User avatar with fallback support.

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="/user.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Dropdown Menu

Context menu component.

```tsx
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger>Open</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Select

Select dropdown component.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

## Layout Components

### Navbar

Main navigation bar with authentication state.

```tsx
import { Navbar } from "@/components/layout/navbar"

<Navbar />
```

Features:
- Responsive design
- User menu dropdown
- Role-based dashboard links
- Sign in/out functionality

## Feature Components

### PostMap

Interactive map component for displaying posts with locations.

```tsx
import { PostMap } from "@/components/map/post-map"

<PostMap
  posts={posts}
  center={[latitude, longitude]}
  zoom={13}
  onPostClick={(post) => console.log(post)}
/>
```

**Props**:
- `posts`: Array of post objects with latitude/longitude
- `center`: Optional `[lat, lng]` tuple
- `zoom`: Map zoom level (default: 13)
- `onPostClick`: Callback when marker is clicked

### VolunteerDirectory

Component for browsing volunteers with search and filtering.

```tsx
import { VolunteerDirectory } from "@/components/volunteer-directory"

<VolunteerDirectory />
```

Features:
- Search by name or bio
- Filter by skills
- Displays volunteer cards with avatars and skills

## Styling

All components use Tailwind CSS with a custom design system defined in `tailwind.config.ts`. CSS variables are defined in `app/globals.css` for theming support.

### Color System

- `primary`: Main brand color
- `secondary`: Secondary actions
- `destructive`: Error/danger actions
- `muted`: Subtle text/backgrounds
- `accent`: Highlighted elements

### Spacing

Uses Tailwind's default spacing scale (4px base unit).

### Typography

- Headings: `font-semibold` or `font-bold`
- Body: Default text size
- Muted text: `text-muted-foreground`

## Best Practices

1. **Composition**: Combine UI primitives to build complex components
2. **Accessibility**: All Radix UI components are accessible by default
3. **Responsive**: Use Tailwind responsive prefixes (`md:`, `lg:`, etc.)
4. **Consistency**: Use existing components rather than creating new ones
5. **Type Safety**: All components are typed with TypeScript

## Extending Components

To create new components:

1. Start with existing UI primitives
2. Add custom styling with Tailwind classes
3. Use `cn()` utility for conditional classes
4. Follow existing component patterns
5. Add TypeScript types
6. Document usage

Example:

```tsx
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CustomCardProps {
  className?: string
  children: React.ReactNode
}

export function CustomCard({ className, children }: CustomCardProps) {
  return (
    <Card className={cn("custom-styles", className)}>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
```


