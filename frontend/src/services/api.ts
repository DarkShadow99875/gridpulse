import { authService } from './authService';

const BACKEND_URL = 'http://localhost:8080';

// Helper to normalize URL to always hit the backend
function normalizeUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    if (input.startsWith('http')) return input;
    if (input.startsWith('/api')) return `${BACKEND_URL}${input}`;
    return input;
  }
  return input.toString();
}

// Global fetch wrapper that automatically adds the JWT token + fixes URL
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const token = authService.getAccessToken();
  const finalUrl = normalizeUrl(input);

  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(finalUrl, {
    ...init,
    headers,
  });

  // Auto refresh on 401
  if (response.status === 401) {
    try {
      await authService.refresh();
      const newToken = authService.getAccessToken();

      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(finalUrl, { ...init, headers });
      } else {
        await authService.logout();
        window.location.href = '/login';
      }
    } catch {
      await authService.logout();
      window.location.href = '/login';
    }
  }

  return response;
}

// Optional: patch global fetch for existing code (use with caution)
export function enableGlobalAuthFetch() {
  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = authService.getAccessToken();

    if (token && typeof input === 'string' && input.includes('/api/')) {
      const finalInput = input.startsWith('http') ? input : `${BACKEND_URL}${input.startsWith('/') ? '' : '/'}${input}`;
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      let response = await originalFetch(finalInput, { ...init, headers });

      if (response.status === 401) {
        try {
          await authService.refresh();
          const newToken = authService.getAccessToken();
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            response = await originalFetch(input, { ...init, headers });
          }
        } catch {
          await authService.logout();
          window.location.href = '/login';
        }
      }

      return response;
    }

    return originalFetch(input, init);
  };
}

export default apiFetch;

