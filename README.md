# MapIT - IT Documentation & Incident Management Platform

**Status**: Phase A (Web Foundation) ✅ Complete | Phase B (Core Pages) 🔄 Ready to Start | Phase C (Full Spec) 📋 Planned

A modern web and mobile platform for managing IT incidents, documentation, assets, and operational knowledge bases. Built with Next.js (web), React Expo (mobile), and Express.js backend.

## Overview

### Architecture
- **Frontend**: Next.js 15 (web) + React Native Expo (mobile)
- **Backend**: Express.js with PostgreSQL + Prisma ORM
- **Auth**: JWT + HttpOnly cookies (BFF pattern on web)
- **Database**: PostgreSQL
- **Deployment Ready**: Vercel (web), Expo (mobile), Docker (API)

### Key Features

#### MVP Phase (In Progress)
- ✅ User authentication (LDAP + dev mode)
- ✅ Dashboard with KPIs and recent activity
- ✅ Incident management (list/create/detail)
- ✅ Document management (list/create/detail)
- ✅ Role-based access control (Admin/User/Viewer)

#### Phase 2 (Planned)
- Asset inventory management
- Problem/Solution knowledge base
- Relationship mapping
- User settings & preferences

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL 14+

### Installation

```bash
# Clone repository
git clone <repo>
cd it-docs-saas

# Install dependencies for all workspaces
npm install
```

### Development

**Terminal 1 - Backend API**:
```bash
npm run dev:api
# Runs on http://localhost:3000
```

**Terminal 2 - Web Frontend**:
```bash
npm run dev:web
# Runs on http://localhost:3001
```

**Terminal 3 - Mobile (optional)**:
```bash
npm run dev:mobile
# Runs on Expo bundler
```

### Testing

```bash
# Full CI pipeline
npm run ci

# Individual commands
npm run typecheck         # TypeScript validation
npm run lint              # Linting
npm run test:api          # API integration tests
npm run smoke:frontend    # Frontend smoke tests
```

### Building

```bash
# Web production build
npm --workspace=apps/web run build
npm --workspace=apps/web run start

# Docker build (API)
docker build -t mapkit-api apps/api
docker run -p 3000:3000 mapkit-api
```

## Project Structure

```
├── apps/
│   ├── api/                    # Express.js backend
│   │   ├── src/
│   │   │   ├── modules/auth/
│   │   │   ├── modules/incidents/
│   │   │   ├── modules/documents/
│   │   │   ├── modules/dashboard/
│   │   │   └── index.js
│   │   ├── prisma/schema.prisma
│   │   └── package.json
│   ├── web/                    # Next.js web app (Phase A: COMPLETE)
│   │   ├── src/
│   │   │   ├── app/            # Pages (/login, /dashboard)
│   │   │   ├── components/     # UI components + layout
│   │   │   ├── lib/            # API client, mock API, utilities
│   │   │   ├── hooks/          # Custom hooks (useApi, useToast)
│   │   │   ├── store/          # Zustand auth store
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   └── middleware.ts   # Route protection
│   │   └── package.json
│   └── mobile/                 # React Native Expo app (secondary)
│       ├── app/
│       ├── components/
│       ├── services/
│       ├── store/
│       ├── src/screens/
│       └── package.json
└── packages/
    └── shared/                 # Shared types/utilities
```

## Development Workflow

### Phase A: Web Foundation (✅ COMPLETE)
- Backend API integration
- Authentication (HttpOnly cookies, middleware protection)
- Design system (Tailwind + shadcn/ui)
- Core pages (login, dashboard)
- Component library & hooks

### Phase B M1: Core Product Pages (🔄 READY)
- Incidents list/create/detail
- Documents list/create/detail
- Search, filtering, pagination
- Admin-gated actions (edit/delete)
- Error handling & loading states

### Phase C M2: Full Feature Set (📋 PLANNED)
- Asset inventory
- Problem/solution KB
- Relationship mapping
- User settings

### Phase D: UX Polish (📋 PLANNED)
- Animations & transitions
- Accessibility audit (WCAG AA)
- Responsive design QA
- Design spec compliance review

### Phase E: Quality & Hardening (📋 DEFERRED)
- Extended test coverage
- E2E smoke tests
- CI/CD pipeline integration
- Backend auth hardening
- Observability & logging

## API Endpoints

### Authentication
- `POST /auth/login` - User login with credentials
- `GET /auth/me` - Get current user

### Incidents
- `GET /incidents` - List all incidents
- `GET /incidents/:id` - Get incident detail
- `POST /incidents` - Create incident (authenticated)
- `PATCH /incidents/:id` - Update incident (admin-only)
- `DELETE /incidents/:id` - Delete incident (admin-only)

### Documents
- `GET /documents` - List all documents (supports ?q=search)
- `GET /documents/:id` - Get document detail
- `POST /documents` - Create document (authenticated)
- `PATCH /documents/:id` - Update document (admin-only)
- `DELETE /documents/:id` - Delete document (admin-only)

### Dashboard
- `GET /dashboard/summary` - Get KPI data and recent activity

### Mock Endpoints (Future Backend Expansion)
- Assets (inventory management)
- Problems (knowledge base)
- Relationships (asset relationships)
- Settings (user preferences)

## Environment Variables

### .env.local (Web)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
API_URL=http://localhost:3000
```

### .env (API)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mapkit
JWT_SECRET=your-secret-key
LDAP_URL=ldap://your-ldap-server
NODE_ENV=development
DEV_MODE=true  # For dev auth, can be disabled
```

## Authentication

### Development Credentials
```
Username: admin
Password: password

Username: testuser
Password: password
```

### Production
Uses LDAP authentication. Dev mode credentials disabled.

## Deployment

### Web (Next.js)
```bash
# Vercel
npm install -g vercel
vercel

# Self-hosted
npm --workspace=apps/web run build
npm --workspace=apps/web run start
```

### API (Docker)
```bash
docker build -t mapkit-api apps/api
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  mapkit-api
```

### Mobile (Expo)
```bash
# Build APK/IPA
eas build --platform android
eas build --platform ios
```

## Technology Stack

### Web Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS 3
- Zustand (state management)
- Axios (HTTP client)
- React Hook Form + Zod (forms)
- Lucide Icons
- @tanstack/react-query (data fetching)

### Mobile Frontend
- React Native (Expo)
- TypeScript
- Tailwind CSS
- Zustand (state)
- Axios (API)

### Backend
- Express.js
- PostgreSQL
- Prisma ORM
- JWT authentication
- LDAP support

### DevOps & Testing
- Docker
- GitHub Actions (CI/CD)
- Vitest (unit tests)
- Playwright (E2E tests)

## Documentation

- [Phase A Completion Guide](./PHASE_A_COMPLETE.md) - Foundation setup details
- [Phase B Implementation Guide](./PHASE_B_IMPLEMENTATION_GUIDE.md) - Patterns & templates for core pages
- [API Documentation](./apps/api/README.md) - Backend API reference
- [Web App Documentation](./apps/web/README.md) - Frontend setup & features
- [Mobile App Documentation](./apps/mobile/README.md) - Mobile app setup

## Known Limitations

- **24h JWT expiry**: No refresh endpoint exists; users re-login after 24 hours (MVP phase acceptable)
- **Mock APIs**: Assets, problems, relationships, settings use typed mock data until backend endpoints exist
- **Mobile secondary**: Web is primary platform; mobile is secondary in Phase 2+
- **Accessibility**: Full WCAG AA compliance deferred to Phase D

## Contributing

1. Create a feature branch
2. Follow the patterns in PHASE_B_IMPLEMENTATION_GUIDE.md
3. Ensure TypeScript strict mode compliance
4. Run `npm run ci` before submitting PR
5. All tests must pass

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review phase documentation in `PHASE_*.md` files
3. Check component documentation in src/components/ui/README.md

## License

ISC

---

**Current Status**: ✅ Phase A Complete - Ready for Phase B Implementation
**Next Steps**: Begin incidents & documents CRUD pages (Phase B M1)
**Estimated Completion**: Full MVP by end of Phase C M2
