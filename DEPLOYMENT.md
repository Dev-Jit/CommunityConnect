# Deployment Guide

This guide covers deploying CommunityConnect to production using Vercel and a managed PostgreSQL database.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Managed PostgreSQL database (options: Vercel Postgres, Supabase, Neon, Railway, etc.)

## Step 1: Prepare Your Database

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Navigate to your project → Storage → Create Database
3. Select "Postgres"
4. Choose a region and create the database
5. Copy the `POSTGRES_URL` connection string

### Option B: External Database (Supabase, Neon, etc.)

1. Create a new PostgreSQL database
2. Copy the connection string (format: `postgresql://user:password@host:port/database`)

## Step 2: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings

3. **Configure Environment Variables**
   
   Add these in Vercel project settings → Environment Variables:
   
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
   ```
   
   Optional (for OAuth):
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```
   
   Optional (for file uploads):
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Method 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set environment variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   ```

## Step 3: Run Database Migrations

After deployment, run migrations:

### Option A: Using Vercel CLI

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

### Option B: Using Vercel Postgres

If using Vercel Postgres, migrations run automatically. For external databases:

1. Connect to your database
2. Run migrations manually or use a migration service

### Option C: Using Prisma Migrate Deploy

```bash
# Set DATABASE_URL in your environment
export DATABASE_URL="your-production-database-url"
npx prisma migrate deploy
```

## Step 4: Seed Database (Optional)

For initial data:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"
npm run db:seed
```

**⚠️ Warning**: Only run seed in production if you want sample data. Remove or secure seed script for production.

## Step 5: Configure OAuth Providers (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
6. Copy Client ID and Secret to Vercel environment variables

### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `https://your-domain.vercel.app/api/auth/callback/github`
4. Copy Client ID and Secret to Vercel environment variables

## Step 6: Configure File Uploads (Optional)

### Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Add to Vercel environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

4. Update `/app/api/upload/route.ts` with Cloudinary SDK:

```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// In uploadToCloudinary function:
const buffer = await file.arrayBuffer()
const result = await new Promise((resolve, reject) => {
  cloudinary.uploader.upload_stream(
    { resource_type: 'auto' },
    (error, result) => {
      if (error) reject(error)
      else resolve(result)
    }
  ).end(Buffer.from(buffer))
})

return result.secure_url
```

## Step 7: Set Up Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` to your custom domain

## Step 8: Enable WebSockets (If Needed)

Vercel supports WebSockets on Hobby plan and above. For free tier, consider:

- Using Server-Sent Events (SSE) instead
- Using a service like Pusher or Ably
- Deploying Socket.IO server separately (Railway, Render, etc.)

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] OAuth providers configured (if using)
- [ ] File upload service configured (if using)
- [ ] Custom domain configured (if using)
- [ ] Test authentication flow
- [ ] Test post creation
- [ ] Test map functionality
- [ ] Verify API routes work
- [ ] Check error logs in Vercel dashboard

## Monitoring

### Vercel Analytics

Enable in Vercel dashboard → Analytics for performance monitoring.

### Error Tracking

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Vercel's built-in logs

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database allows connections from Vercel IPs
- Ensure SSL is enabled if required

### Build Failures

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `package.json` scripts are correct

### Authentication Issues

- Verify `NEXTAUTH_URL` matches your domain
- Check OAuth callback URLs are correct
- Ensure `NEXTAUTH_SECRET` is set

### Map Not Loading

- Verify Leaflet CSS is imported
- Check browser console for errors
- Ensure map tiles are accessible (OpenStreetMap)

## Scaling Considerations

- **Database**: Upgrade to managed database with connection pooling
- **File Storage**: Use CDN for images (Cloudinary, AWS S3)
- **Caching**: Add Redis for session storage and caching
- **CDN**: Vercel automatically provides CDN
- **Monitoring**: Set up uptime monitoring (UptimeRobot, Pingdom)

## Security Checklist

- [ ] Use strong `NEXTAUTH_SECRET`
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Set secure CORS policies
- [ ] Validate all user inputs
- [ ] Use parameterized queries (Prisma handles this)
- [ ] Rate limit API routes
- [ ] Enable database backups
- [ ] Regular security updates

## Support

For issues:
1. Check Vercel deployment logs
2. Review Next.js documentation
3. Check Prisma documentation for database issues
4. Open an issue on GitHub


