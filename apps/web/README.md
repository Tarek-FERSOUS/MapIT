# Next.js Web App for MapIT

Modern web dashboard built with Next.js, Tailwind CSS, and shadcn/ui components.

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies from root
npm install

# Run development server
npm run dev:web

# Production build
npm --workspace=apps/web run build

# Start production server
npm --workspace=apps/web run start
```

### Environment Setup

Create `.env.local` in `apps/web/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
```

## Features

- **Authentication**: HttpOnly cookie-based session management
- **API Integration**: BFF pattern with real API calls and mock adapters
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Component Library**: Reusable UI components with Lucide icons
- **Type Safety**: Full TypeScript support with strict mode

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable components
│   ├── lib/              # Utilities and API clients
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript types
│   └── middleware.ts     # Route protection middleware
├── public/               # Static assets
└── tailwind.config.ts    # Tailwind configuration
```

## Development

### Start Development Server

```bash
npm run dev:web
```

Runs on http://localhost:3001

### Run Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

### Build for Production

```bash
npm --workspace=apps/web run build
npm --workspace=apps/web run start
```

## Authentication

- Login endpoint: `/login`
- Session managed via HttpOnly cookie
- BFF routes at `/api/auth/*`
- Protected routes automatically redirect to login

## API Integration

The web app integrates with the Node.js API backend:

- Real endpoints for incidents, documents, and dashboard
- Mock service for assets, problems, relationships, and settings
- Automatic 401 handling with redirect to login

## Testing

```bash
npm run test
npm run test:e2e
```

## Deployment

Ready for deployment to:

- Vercel
- Netlify
- Docker container
- Traditional Node.js hosting

Requires environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `API_URL`: Server-side API URL for BFF

## License

ISC
