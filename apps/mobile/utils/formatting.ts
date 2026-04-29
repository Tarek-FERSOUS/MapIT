// Date and time formatting utilities
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateString;
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
}

export function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

// Status and priority color mapping
export function getIncidentStatusColor(status: string): string {
  switch (status) {
    case "OPEN":
      return "#EF4444"; // red
    case "IN_PROGRESS":
      return "#F59E0B"; // amber
    case "BLOCKED":
      return "#EC4899"; // pink
    case "RESOLVED":
      return "#10B981"; // emerald
    case "CLOSED":
      return "#6B7280"; // gray
    default:
      return "#6B7280";
  }
}

export function getIncidentPriorityColor(priority: string): string {
  switch (priority) {
    case "CRITICAL":
      return "#DC2626"; // red-600
    case "HIGH":
      return "#EA580C"; // orange-600
    case "MEDIUM":
      return "#FBBF24"; // amber-400
    case "LOW":
      return "#10B981"; // emerald-600
    default:
      return "#6B7280";
  }
}

export function getProblemSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "#DC2626";
    case "HIGH":
      return "#EA580C";
    case "MEDIUM":
      return "#FBBF24";
    case "LOW":
      return "#10B981";
    default:
      return "#6B7280";
  }
}

export function getAssetStatusColor(status: string): string {
  switch (status) {
    case "Active":
      return "#10B981"; // emerald
    case "Inactive":
      return "#6B7280"; // gray
    case "Maintenance":
      return "#F59E0B"; // amber
    default:
      return "#6B7280";
  }
}

// String utilities
export function truncate(text: string, length: number = 50): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return "U";
  const f = firstName?.charAt(0).toUpperCase() || "";
  const l = lastName?.charAt(0).toUpperCase() || "";
  return (f + l).substring(0, 2);
}

export function getFullName(firstName?: string | null, lastName?: string | null, username?: string): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) return firstName;
  if (lastName) return lastName;
  return username || "Unknown";
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[], key?: (item: T) => any): T[] {
  if (!key) return [...new Set(array)];
  const seen = new Set();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// Search utilities
export function matchesSearchQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function searchInObject<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;

  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) =>
      String(item[field]).toLowerCase().includes(lowerQuery)
    )
  );
}
