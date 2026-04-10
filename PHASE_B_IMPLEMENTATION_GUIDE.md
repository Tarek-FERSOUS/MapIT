# Phase B M1 Implementation Guide - Incidents & Documents Pages

## Overview
Phase B M1 involves building 6 core product pages using real backend API endpoints. This guide provides patterns, templates, and sequential implementation order.

## Backend API Contract Reference

### Incidents Endpoints
- `GET /incidents` - List all incidents (unfiltered for MVP; pagination can be added)
- `GET /incidents/:id` - Get single incident
- `POST /incidents` - Create new incident (title, description required)
- `PATCH /incidents/:id` - Update incident (admin-only)
- `DELETE /incidents/:id` - Delete incident (admin-only)

### Documents Endpoints
- `GET /documents` - List all documents (supports ?q=query param for search)
- `GET /documents/:id` - Get single document
- `POST /documents` - Create new document (title, content required)
- `PATCH /documents/:id` - Update document (admin-only)
- `DELETE /documents/:id` - Delete document (admin-only)

## Implementation Sequence

### Step 1: Incidents List Page
**File**: `src/app/incidents/page.tsx`
**Endpoint**: `GET /incidents`
**Key Features**:
- Display list of all incidents in card/table format
- Show: Title, Status badge, Date, Brief description, Assignee if available
- Search/filter input (client-side filtering for MVP, can add server-side backend param later)
- Loading state (skeleton or spinner)
- Empty state (no incidents)
- Error handling (display ErrorAlert if fetch fails)
- "Create new incident" button linking to `/incidents/new`
- Click card/row to link to detail page `/incidents/[id]`

**Pattern Template**:
```typescript
'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Incident } from '@/types/api';
import { useToast } from '@/hooks/useUi';
import { LoadingSpinner, EmptyState, ErrorAlert, Card } from '@/components/ui';
import { IncidentStatusBadge } from '@/components/ui/status-badges';
import { formatDateTime } from '@/lib/formatting';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useToast();

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.get<Incident[]>('/incidents');
      setIncidents(data);
      setFilteredIncidents(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load incidents';
      setError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = incidents.filter(i =>
      i.title.toLowerCase().includes(query.toLowerCase()) ||
      i.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredIncidents(filtered);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} onDismiss={() => setError(null)} />;
  if (filteredIncidents.length === 0) {
    return (
      <EmptyState
        title={searchQuery ? 'No incidents found' : 'No incidents yet'}
        description={searchQuery ? `No incidents match "${searchQuery}"` : 'Create your first incident'}
        action={<a href="/incidents/new" className="btn btn-primary">Create Incident</a>}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Incidents</h1>
        <p className="text-slate-600">Manage and track all incidents</p>
      </div>
      
      {/* Search bar */}
      {/* Grid/List of incident cards */}
      {/* Link to create page */}
    </div>
  );
}
```

### Step 2: Incidents Create Page
**File**: `src/app/incidents/new/page.tsx`
**Endpoint**: `POST /incidents`
**Key Features**:
- Form: Title (text), Description (textarea), optionally Severity/Status dropdowns
- Submit button with loading state
- Error display
- Success redirect to `/incidents`
- Cancel button back to `/incidents`
- Form validation (title required)

**Pattern**: Form submission → `apiClient.post('/incidents', {title, description})` → success toast → `router.push('/incidents')`

### Step 3: Incidents Detail Page
**File**: `src/app/incidents/[id]/page.tsx`
**Endpoint**: `GET /incidents/:id`
**Key Features**:
- Display full incident details
- Show created date, last updated date
- Status badge, severity badge
- Description content
- Admin-only: Edit button (links to `/incidents/[id]/edit` - defer page creation to future if time permits), Delete button with confirmation
- Breadcrumb navigation
- Back button
- Loading/error states

### Step 4: Documents List Page
**File**: `src/app/documents/page.tsx`
**Endpoint**: `GET /documents?q=searchQuery`
**Key Features**:
- List all documents
- Search input with debounce (client-side OR backend param - try backend if API supports it)
- Show: Title, Type badge, Date created, Brief preview, Author
- Empty/loading/error states
- "Create document" button
- Click to navigate to detail page

### Step 5: Documents Create Page
**File**: `src/app/documents/new/page.tsx`
**Endpoint**: `POST /documents`
**Key Features**:
- Form: Title, Content (textarea or rich editor if available), Type dropdown, Tags/Categories
- Submit with loading state
- Success redirect to `/documents`
- Cancel back to `/documents`

### Step 6: Documents Detail Page
**File**: `src/app/documents/[id]/page.tsx`
**Endpoint**: `GET /documents/:id`
**Key Features**:
- Display full document
- Content rendering (plain text or formatted if available)
- Type/tags display
- Created/updated dates
- Author info
- Admin-only: Edit button, Delete button with confirmation modal
- Breadcrumb, Back button
- Related incidents (if relationship data available)

## Reusable Patterns & Components

### Form Pattern (for Create pages)
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

export default function CreatePage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await apiClient.post('/endpoint', data);
      toast.success('Created successfully');
      router.push('/list-page');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('title')} error={errors.title?.message} label="Title" />
      <Input {...register('description')} error={errors.description?.message} label="Description" />
      <Button type="submit" isLoading={isSubmitting}>Create</Button>
    </form>
  );
}
```

### List Page Pattern
```typescript
const [items, setItems] = useState<Item[]>([]);
const [filteredItems, setFilteredItems] = useState<Item[]>([]);
const [query, setQuery] = useState('');
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  fetchItems();
}, []);

const fetchItems = async () => {
  try {
    setIsLoading(true);
    const data = await apiClient.get('/endpoint');
    setItems(data);
    setFilteredItems(data);
  } catch (err) {
    // Handle error
  } finally {
    setIsLoading(false);
  }
};

// Search with debounce (optional)
useEffect(() => {
  const timer = setTimeout(() => {
    const filtered = items.filter(i => 
      i.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  }, 300);
  return () => clearTimeout(timer);
}, [query, items]);
```

### Detail Page Pattern
```typescript
const router = useRouter();
const params = useParams();
const [item, setItem] = useState<Item | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  if (params.id) {
    fetchDetail();
  }
}, [params.id]);

const fetchDetail = async () => {
  try {
    setIsLoading(true);
    const data = await apiClient.get(`/endpoint/${params.id}`);
    setItem(data);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setIsLoading(false);
  }
};

const handleDelete = async () => {
  if (confirm('Are you sure? This cannot be undone.')) {
    try {
      await apiClient.delete(`/endpoint/${params.id}`);
      toast.success('Deleted successfully');
      router.push('/list-page');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }
};
```

### Delete Confirmation Pattern
```typescript
import { Modal, useModal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

const { isOpen, open, close } = useModal();

return (
  <>
    <Button variant="danger" onClick={open}>Delete</Button>
    <Modal isOpen={isOpen} onClose={close} title="Delete Incident?">
      <p>This action cannot be undone.</p>
      <div className="mt-4 flex gap-2">
        <Button onClick={close} variant="ghost">Cancel</Button>
        <Button onClick={handleDelete} variant="danger">Delete</Button>
      </div>
    </Modal>
  </>
);
```

## Key Imports to Use

```typescript
// Components
import { Button, Input, Badge, LoadingSpinner, EmptyState, ErrorAlert, Card } from '@/components/ui';
import { IncidentStatusBadge, SeverityBadge, DocumentTypeBadge } from '@/components/ui/status-badges';
import { Breadcrumb, Pagination } from '@/components/ui/pagination';

// Hooks
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/hooks/useUi';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

// Utilities
import { apiClient } from '@/lib/api';
import { formatDateTime, formatRelativeTime, getErrorMessage } from '@/lib/formatting';
import { Incident, Document } from '@/types/api';

// Forms
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
```

## UI Layout Patterns

### List Page Layout
```
Header (Title + subtitle)
Search/Filter bar
Loading state OR
Error alert OR
Card grid/table with:
  - Item content
  - Badges (status, type, etc.)
  - Dates (relative time)
  - Action buttons (view/edit/delete)
Empty state (if no items)
```

### Create Page Layout
```
Header (Title: "Create New [Item]")
Breadcrumb (if applicable)
Form card with:
  - Each input field
  - Error messages below each field
  - Submit button with loading state
  - Cancel button
Success toast on submission
```

### Detail Page Layout
```
Breadcrumb navigation
Back button
Header (Title + metadata badges)
Content sections
Admin actions (edit/delete) in sidebar or top-right
Loading skeleton OR error alert
```

## Testing Workflow

1. Boot backend: `npm run dev:api` (Express on :3000)
2. Boot frontend: `npm run dev:web` (Next.js on :3001)
3. Login with dev credentials (admin:password or testuser:password)
4. Navigate to `/incidents`
5. Verify GET /incidents loads real data
6. Click "Create" → navigate to `/incidents/new`
7. Submit form → verify POST /incidents succeeds → redirect to list
8. Click incident card → navigate to `/[id]` → verify GET /incidents/:id loads detail
9. Repeat for documents

## Performance Considerations

- **Pagination**: If incidents/documents list grows large, implement pagination using `?page=1&limit=20` backend params
- **Search Debounce**: Add 300ms debounce to search input to avoid excessive API calls
- **Client-side Filtering**: For MVP, filter on client after initial fetch; upgrade to backend full-text search later
- **Caching**: Use React Query or SWR when Phase B is complete for smart caching/refetching

## Common Gotchas

1. **Role Gating**: Edit/Delete buttons should only show if `useAuthStore(state => state.user?.role) === 'admin'`
2. **API Errors**: Always call `getErrorMessage()` on catch blocks to display user-friendly error messages
3. **Loading States**: Show spinner while fetching; disable buttons while submitting
4. **Empty States**: Different messaging for "no results" vs "no data"
5. **Date Formatting**: Use `formatDateTime()` for full dates, `formatRelativeTime()` for "time ago"

## Next Steps After Phase B M1

- Phase C M2: Build mock pages (Assets, Problems, Relationships, Settings)
- Phase D: UX polish (animations, accessibility, responsive QA)
- Phase E: Quality gates (tests, e2e, CI/CD, deployment scripts)

---

**Estimated time**: 2-3 hours for all 6 pages with pattern reuse
**Dependencies**: Phase A must be complete (✅ verified)
**Blockers**: None identified; backend API is available and functioning
