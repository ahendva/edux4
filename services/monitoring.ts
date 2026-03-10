// services/monitoring.ts
// Crash & performance monitoring wrapper (Sentry placeholder)

let initialized = false;

export function initMonitoring(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    initialized = true;
    console.log('[Monitoring] Sentry initialized');
  } catch (e) {
    console.warn('[Monitoring] Failed to initialize Sentry:', e);
  }
}

export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;
  try {
    // Sentry.captureException(error, { extra: context });
  } catch (e) {
    console.warn('[Monitoring] captureException failed:', e);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!initialized) return;
}

export function setUserContext(userId: string, username?: string): void {
  if (!initialized) return;
}

export function clearUserContext(): void {
  if (!initialized) return;
}
