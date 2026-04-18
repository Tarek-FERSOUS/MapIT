/**
 * Development environment validation
 * Ensures required environment variables are set
 */

export function validateEnv() {
  const requiredVars = ['NEXT_PUBLIC_API_URL'];
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️ Warning: Missing environment variables: ${missing.join(', ')}\n` +
      'Default values may be used, which could cause unexpected behavior.\n' +
      'Create apps/web/.env.local and set required variables.'
    );
  }
}

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  apiUrlServer: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
};

// Validate on module load (only in development)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  validateEnv();
}
