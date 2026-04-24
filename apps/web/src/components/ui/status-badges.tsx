import { Badge } from '@/components/ui/badge';
import React from 'react';

/**
 * Status badge component for incidents
 */
export interface IncidentStatusBadgeProps {
  status: 'open' | 'in_progress' | 'blocked' | 'resolved' | 'closed' | 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'RESOLVED' | 'CLOSED';
}

export function IncidentStatusBadge({ status }: IncidentStatusBadgeProps) {
  const normalized = String(status).toLowerCase();
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    open: 'error',
    in_progress: 'warning',
    blocked: 'warning',
    resolved: 'success',
    closed: 'default',
  };

  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    resolved: 'Resolved',
    closed: 'Closed',
  };

  return (
    <Badge variant={variants[normalized] || 'default'}>
      {labels[normalized] || String(status).replace(/_/g, ' ')}
    </Badge>
  );
}

export interface IncidentPriorityBadgeProps {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical';
}

export function IncidentPriorityBadge({ priority }: IncidentPriorityBadgeProps) {
  const normalized = String(priority).toLowerCase();
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    low: 'info',
    medium: 'warning',
    high: 'error',
    critical: 'primary'
  };

  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical'
  };

  return <Badge variant={variants[normalized] || 'default'}>{labels[normalized] || String(priority)}</Badge>;
}

/**
 * Severity badge for incidents/problems
 */
export interface SeverityBadgeProps {
  level: 'critical' | 'high' | 'medium' | 'low';
}

export function SeverityBadge({ level }: SeverityBadgeProps) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    critical: 'error',
    high: 'error',
    medium: 'warning',
    low: 'info',
  };

  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <Badge variant={variants[level] || 'default'}>
      {labels[level] || level}
    </Badge>
  );
}

/**
 * Role badge for users
 */
export interface RoleBadgeProps {
  role: 'admin' | 'user' | 'viewer';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    admin: 'primary',
    user: 'info',
    viewer: 'default',
  };

  const labels: Record<string, string> = {
    admin: 'Admin',
    user: 'User',
    viewer: 'Viewer',
  };

  return (
    <Badge variant={variants[role] || 'default'}>
      {labels[role] || role}
    </Badge>
  );
}

/**
 * Document type badge
 */
export interface DocumentTypeBadgeProps {
  type: 'procedure' | 'guide' | 'checklist' | 'reference';
}

export function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
    procedure: 'primary',
    guide: 'info',
    checklist: 'default',
    reference: 'default',
  };

  const labels: Record<string, string> = {
    procedure: 'Procedure',
    guide: 'Guide',
    checklist: 'Checklist',
    reference: 'Reference',
  };

  return (
    <Badge variant={variants[type] || 'default'}>
      {labels[type] || type}
    </Badge>
  );
}
