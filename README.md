# CommunityConnect

A full-stack web application connecting volunteers with community organizations, built with Next.js, TypeScript, Prisma, and PostgreSQL.

## Features

- 🔐 **Authentication**: Email/password and OAuth (Google, GitHub) support
- 👥 **Role-Based Access**: Separate dashboards for Volunteers, Organizations, and Admins
- 🗺️ **Map-Based Discovery**: Interactive map using Leaflet to find opportunities nearby
- 📍 **Location Services**: Geocoding and distance-based filtering
- 🏷️ **Tagging System**: Category and custom tag support for posts
- ⚡ **Real-Time Updates**: WebSocket support for live notifications
- 🔍 **Search & Filters**: Advanced search with category, location, and skill filters
- 👤 **Volunteer Directory**: Browse volunteers by skills and location
- 📝 **Post Management**: Create, edit, and manage volunteer opportunities
- 📸 **Media Upload**: Secure file uploads for post images
- 🛡️ **Admin Dashboard**: Content moderation and platform statistics
- ✅ **Input Validation**: Zod schema validation for all inputs
- 🧪 **Testing**: Unit and integration tests with Jest
- 🚀 **CI/CD**: GitHub Actions workflow for automated testing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Maps**: Leaflet / React-Leaflet
- **Real-Time**: Socket.IO
- **Validation**: Zod
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or managed)
- (Optional) Cloudinary account for image uploads
- (Optional) OAuth app credentials (Google, GitHub)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd communityconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/communityconnect"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
communityconnect/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── volunteer/         # Volunteer dashboard
│   ├── organization/      # Organization dashboard
│   └── posts/             # Post pages
├── components/            # React components
│   ├── ui/                # Reusable UI primitives
│   ├── layout/            # Layout components
│   └── map/               # Map components
├── lib/                   # Utility functions
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   ├── validations.ts     # Zod schemas
│   └── utils.ts           # Helper functions
├── prisma/                # Database schema and migrations
│   ├── schema.prisma      # Prisma schema
│   └── seed.ts            # Seed data script
└── __tests__/             # Test files
```

## Database Schema

### Models

- **User**: Volunteers, Organizations, and Admins
- **Organization**: Organization profiles linked to users
- **Post**: Volunteer opportunity posts
- **Application**: Volunteer applications to posts
- **Notification**: User notifications
- **Account/Session**: NextAuth authentication

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints

### Posts
- `GET /api/posts` - List posts (with filters)
- `POST /api/posts` - Create post
- `GET /api/posts/[id]` - Get post details
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `GET /api/posts/my` - Get user's posts

### Applications
- `POST /api/applications` - Apply to post
- `GET /api/applications/my` - Get user's applications

### Volunteers
- `GET /api/volunteers` - List volunteers (directory)

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/flagged-posts` - Get flagged posts
- `POST /api/admin/moderate/[id]` - Moderate post

### Upload
- `POST /api/upload` - Upload file

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate coverage report:
```bash
npm run test:coverage
```

## Deployment

### Vercel Deployment

1. **Push your code to GitHub**

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables

3. **Set up database**
   - Use Vercel Postgres or external managed database (e.g., Supabase, Neon)
   - Add `DATABASE_URL` to Vercel environment variables

4. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Environment Variables for Production

Ensure these are set in your Vercel project:
- `DATABASE_URL`
- `NEXTAUTH_URL` (your production domain)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (if using OAuth)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (if using OAuth)
- `CLOUDINARY_*` (if using Cloudinary for uploads)

## Seed Data

The seed script creates:
- 1 Admin user: `admin@communityconnect.com` / `admin123`
- 2 Volunteer users: `volunteer1@example.com` / `volunteer123`
- 2 Organization users: `org1@example.com` / `org123`
- Sample posts and applications

Run seed:
```bash
npm run db:seed
```

## Development

### Database Management

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes (dev)
npm run db:push

# Create migration (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Code Style

The project uses ESLint with Next.js configuration. Run:
```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

