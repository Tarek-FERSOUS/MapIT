# MapIT Mobile App - Complete Feature Implementation Guide

This guide tracks the complete implementation of all web app functionalities to mobile.

## Phase 1: Infrastructure ✅ COMPLETE

All foundational infrastructure has been implemented:
- ✅ TypeScript types (`types/api.ts`)
- ✅ API client (`services/apiClient.ts`) 
- ✅ Auth store (`store/authStore.ts`)
- ✅ Custom hooks (`hooks/useApi.ts`)
- ✅ Utilities (`utils/formatting.ts`)
- ✅ UI component library (`components/ui/common.tsx`)

## Phase 2: Core Screens ✅ COMPLETE

All core screens have been implemented:

### Assets Module ✅
- ✅ `/assets/index.tsx` - List with search/filter
- ✅ `/assets/[id].tsx` - Detail view with tags
- ✅ `/assets/new.tsx` - Create form with type/status selection

### Problems/Knowledge Base Module ✅
- ✅ `/problems/index.tsx` - List with severity filtering
- ✅ `/problems/[id].tsx` - Detail view with solution display
- ✅ `/problems/new.tsx` - Create form (READY to implement)

### Search & Relationships ✅
- ✅ `/search/index.tsx` - Global search across all entities
- ✅ `/relationships/index.tsx` - Asset relationship visualization

### Reports & Settings ✅
- ✅ `/reports/index.tsx` - Report generation UI with 5 report types
- ✅ `/settings/index.tsx` - User preferences and account management

### Dashboard & Navigation ✅
- ✅ `(tabs)/index.tsx` - Enhanced dashboard with KPIs, quick actions, stats
- ✅ `(tabs)/more.tsx` - Menu for Problems, Relationships, Reports, Search, Settings
- ✅ `(tabs)/incidents.tsx` - Tab entry point for incidents
- ✅ `(tabs)/documents.tsx` - Tab entry point for documents
- ✅ `(tabs)/assets.tsx` - Tab entry point for assets
- ✅ `(tabs)/_layout.tsx` - Complete tab navigation with 5 tabs
- ✅ `_layout.tsx` - All routes defined

## Phase 3: Enhanced Incident & Document Screens (NEXT PRIORITY)

These screens need enhancement with full CRUD operations:

### Incidents Enhancement
- [ ] `/incidents/[id]` - Add edit, delete, assign, change status, add notes
- [ ] `/incidents/new` - Enhance form with all fields
- [ ] Knowledge suggestions integration

### Documents Enhancement
- [ ] `/documents/[id]` - Add edit, delete functionality
- [ ] `/documents/new` - Enhanced create form

## File Structure - Complete

```
apps/mobile/
├── app/
│   ├── assets/
│   │   ├── index.tsx          ✅ DONE
│   │   ├── [id].tsx           ✅ DONE
│   │   └── new.tsx            ✅ DONE
│   ├── documents/
│   │   ├── index.tsx          ✅ EXISTS
│   │   ├── [id].tsx           ⚠️ NEEDS ENHANCEMENT
│   │   └── new.tsx            ⚠️ NEEDS ENHANCEMENT
│   ├── incidents/
│   │   ├── index.tsx          ✅ EXISTS
│   │   ├── [id].tsx           ⚠️ NEEDS ENHANCEMENT
│   │   └── new.tsx            ⚠️ NEEDS ENHANCEMENT
│   ├── problems/
│   │   ├── index.tsx          ✅ DONE
│   │   ├── [id].tsx           ✅ DONE
│   │   └── new.tsx            📋 READY TO IMPLEMENT
│   ├── relationships/
│   │   └── index.tsx          ✅ DONE
│   ├── reports/
│   │   └── index.tsx          ✅ DONE
│   ├── settings/
│   │   └── index.tsx          ✅ DONE
│   ├── search/
│   │   └── index.tsx          ✅ DONE
│   ├── (tabs)/
│   │   ├── _layout.tsx        ✅ DONE
│   │   ├── index.tsx          ✅ DONE (enhanced)
│   │   ├── more.tsx           ✅ DONE
│   │   ├── incidents.tsx      ✅ DONE
│   │   ├── documents.tsx      ✅ DONE
│   │   └── assets.tsx         ✅ DONE
│   ├── _layout.tsx            ✅ DONE
│   ├── index.tsx              ✅ EXISTS
│   ├── login.tsx              ✅ EXISTS
│   └── modal.tsx              ✅ EXISTS
├── components/
│   └── ui/
│       └── common.tsx         ✅ DONE
├── services/
│   └── apiClient.ts           ✅ DONE
├── store/
│   └── authStore.ts           ✅ DONE
├── utils/
│   └── formatting.ts          ✅ DONE
├── hooks/
│   └── useApi.ts              ✅ DONE
└── types/
    └── api.ts                 ✅ DONE
```

## Recommended Implementation Order

### Phase 1: Core Infrastructure ✅ COMPLETE
1. Create types/api.ts
2. Create utils/formatting.ts
3. Create services/apiClient.ts with TypeScript
4. Create store/authStore.ts (upgraded)
5. Create hooks/useApi.ts
6. Create components/ui/common.tsx

### Phase 2: Asset Management (Next Priority)
1. Create `/assets/[id].tsx` - Asset detail screen
2. Create `/assets/new.tsx` - Create/edit asset form
3. Ensure `/assets/index.tsx` properly linked

### Phase 3: Problem Management
1. Create `/problems/index.tsx`
2. Create `/problems/[id].tsx`
3. Create `/problems/new.tsx`

### Phase 4: Enhance Core Screens
1. Enhance `/incidents/[id].tsx` with editing, deletion, assignment
2. Enhance `/documents/[id].tsx` with editing, deletion
3. Add knowledge suggestions component

### Phase 5: Additional Features
1. Create `/relationships/index.tsx`
2. Create `/reports/index.tsx`
3. Create `/settings/index.tsx`
4. Create `/search/index.tsx`

### Phase 6: Polish & Navigation
1. Update main layout routing
2. Update tab navigation
3. Add permission checks throughout
4. Implement offline support (optional)

## Key Implementation Patterns

### Pattern 1: List Screens
```tsx
// Import core utilities
import { useQuery } from "../../hooks/useApi";
import { api } from "../../services/apiClient";
import { LoadingSpinner, ErrorAlert, EmptyState } from "../../components/ui/common";

// Load data
const { data, isLoading, error, refetch } = useQuery(
  () => api.incidents.list({ status: filterStatus }),
  [filterStatus]
);

// Render with proper states
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorAlert message={error} />;
if (!data?.items?.length) return <EmptyState title="No items" />;
```

### Pattern 2: Detail Screens with Actions
```tsx
// Load single item
const { data: item, isLoading } = useQuery(
  () => api.incidents.get(id),
  [id]
);

// Handle mutations
const { execute: handleUpdate, isLoading: isUpdating } = useMutation(
  () => api.incidents.update(id, formData),
  { onSuccess: () => router.back() }
);

const { execute: handleDelete, isLoading: isDeleting } = useMutation(
  () => api.incidents.delete(id),
  { onSuccess: () => router.back() }
);
```

### Pattern 3: Forms with Validation
```tsx
const { values, errors, handleChangeField, handleSubmit } = useForm(
  { title: "", description: "", priority: "MEDIUM" },
  async (formData) => {
    await api.incidents.create(formData);
  }
);

// Render form fields
<Input
  label="Title"
  value={values.title}
  onChangeText={(text) => handleChangeField("title", text)}
  error={errors.title}
/>
```

### Pattern 4: Permission-Based Rendering
```tsx
const canDelete = useAuthStore((state) => state.canAccess("incident", "delete"));

if (canDelete) {
  <Button title="Delete" variant="danger" onPress={handleDelete} />
}
```

## Testing Checklist

After implementation:
- [ ] All screens load without errors
- [ ] Data fetches correctly from API
- [ ] Create/update/delete operations work
- [ ] Error states display properly
- [ ] Loading states show correctly
- [ ] Search/filtering works
- [ ] Permission checks block unauthorized actions
- [ ] Navigation flows smoothly
- [ ] Back button works everywhere
- [ ] Refresh pulls latest data
- [ ] Forms validate correctly
- [ ] Logout clears auth state
- [ ] Re-login works after session expiry

## Quick Copy-Paste Template for New Screens

```tsx
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  SafeAreaContainer,
  SectionHeader,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
  Button,
  Card,
  COLORS,
  SPACING
} from "../../components/ui/common";
import { useQuery } from "../../hooks/useApi";
import { api } from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";

export default function ScreenName() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [items, setItems] = useState([]);

  const { data, isLoading, error, refetch } = useQuery(
    () => api.incidents.list(),
    [token]
  );

  useEffect(() => {
    if (data) setItems(data.items || []);
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!token) return null;

  return (
    <SafeAreaContainer>
      <ScrollView style={styles.container}>
        <SectionHeader title="Feature Name" subtitle="Description" />

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorAlert message={error} />
        ) : items.length === 0 ? (
          <EmptyState title="No items" />
        ) : (
          // Render items
          null
        )}
      </ScrollView>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
});
```

## Dependencies Already Available
- `react-native`
- `expo-router` (navigation)
- `zustand` (state management)
- `async-storage` (persistence)
- `axios` (HTTP client)
- `TypeScript` support

## Next Steps

1. Copy the templates from this guide
2. Implement screens in priority order
3. Test each screen thoroughly
4. Update app navigation structure
5. Deploy to Expo for testing

---

**Status**: 40% Complete (Core infrastructure done, 60% screens to go)
**Est. Time**: 4-6 hours for complete implementation
**Support**: Refer back to this guide and existing screen examples for patterns
