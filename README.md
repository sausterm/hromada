# Hromada 🇺🇦

**Hromada** (громада) - Ukrainian word for "community"

A platform connecting American donors directly with Ukrainian municipalities that need support for critical infrastructure.

## Features

- **Interactive Map** - Browse verified projects on an interactive map of Ukraine
- **Category Filtering** - Filter by hospitals, schools, water utilities, energy infrastructure
- **Direct Connection** - Contact municipalities directly through inquiry forms
- **Admin Dashboard** - Manage projects and respond to inquiries

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma
- **Maps**: Leaflet + OpenStreetMap
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (we recommend [Supabase](https://supabase.com) free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sausterm/hromada.git
   cd hromada
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (public)/           # Public pages (home, project detail)
│   ├── admin/              # Admin dashboard
│   │   └── projects/       # Project management
│   └── api/                # API routes
│       ├── projects/       # Project CRUD
│       └── inquiries/      # Inquiry handling
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── map/                # Map components (Leaflet)
│   ├── projects/           # Project-related components
│   └── admin/              # Admin-specific components
├── lib/
│   ├── prisma.ts           # Database client
│   └── utils/              # Helper functions
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript definitions
└── __tests__/              # Test files
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run tests
npm test -- --watch  # Run tests in watch mode
npm test -- --coverage  # Run with coverage report

# Code Quality
npm run lint         # Run ESLint
npx tsc --noEmit     # Type check

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio
```

## Environment Variables

See `.env.example` for all required environment variables.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DIRECT_URL` | Yes | Direct database URL (for migrations) |
| `HROMADA_ADMIN_SECRET` | Yes | Admin authentication password |
| `NEXT_PUBLIC_APP_URL` | No | Public app URL |

## API Routes

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/projects` | List all projects | Public |
| POST | `/api/projects` | Create project | Admin |
| GET | `/api/projects/[id]` | Get single project | Public |
| PUT | `/api/projects/[id]` | Update project | Admin |
| DELETE | `/api/projects/[id]` | Delete project | Admin |
| GET | `/api/inquiries` | List inquiries | Admin |
| POST | `/api/inquiries` | Submit inquiry | Public |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- AWS Amplify
- Netlify
- Railway
- Render

## License

MIT

## Support

For questions or support, please open an issue on GitHub.
