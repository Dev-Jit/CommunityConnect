# Quick Start Guide

Get CommunityConnect running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote)

## Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - `http://localhost:3000`

### 3. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database schema
npx prisma db push

# Seed with sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts

After seeding:

- **Admin**: `admin@communityconnect.com` / `admin123`
- **Volunteer**: `volunteer1@example.com` / `volunteer123`
- **Organization**: `org1@example.com` / `org123`

## Next Steps

- Browse posts at `/posts`
- Create a post at `/posts/new`
- Access dashboards:
  - Volunteer: `/volunteer/dashboard`
  - Organization: `/organization/dashboard`
  - Admin: `/admin/dashboard`

## Troubleshooting

**Database connection error?**
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`

**Prisma errors?**
- Run `npx prisma generate` again
- Check database permissions

**Port already in use?**
- Change port: `npm run dev -- -p 3001`

## Need Help?

Check the [README.md](./README.md) for detailed documentation.

