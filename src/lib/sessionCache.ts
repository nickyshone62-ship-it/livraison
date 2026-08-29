let cachedSession: any = null;
let lastFetchTime = 0;
let pendingPromise: Promise<any> | null = null;

export async function fetchAuthMe(forceRefresh = false): Promise<any> {
  const now = Date.now();

  // Return memory cache if fresh (< 15 seconds) and not forced
  if (!forceRefresh && cachedSession && now - lastFetchTime < 15000) {
    return cachedSession;
  }

  // Deduplicate parallel inflight HTTP requests
  if (pendingPromise && !forceRefresh) {
    return pendingPromise;
  }

  pendingPromise = (async () => {
    try {
      // Restore from sessionStorage for instant initial render
      if (!cachedSession && typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('ouaga_user_session');
        if (stored) {
          try {
            cachedSession = JSON.parse(stored);
          } catch (e) {}
        }
      }

      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!res.ok) {
        cachedSession = null;
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('ouaga_user_session');
        }
        return null;
      }

      const data = await res.json();
      cachedSession = data.user || null;
      lastFetchTime = Date.now();

      if (typeof window !== 'undefined' && cachedSession) {
        sessionStorage.setItem('ouaga_user_session', JSON.stringify(cachedSession));
      }

      return cachedSession;
    } catch (err) {
      return cachedSession;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

export function clearAuthCache() {
  cachedSession = null;
  lastFetchTime = 0;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('ouaga_user_session');
  }
}
