import { authService } from './authService';

let nativeFetch: typeof window.fetch = window.fetch.bind(window);
let fetchPatched = false;

function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/auth/');
}

function normalizeUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  return input.toString();
}

// Global fetch wrapper that automatically adds the JWT token + fixes URL
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const finalUrl = normalizeUrl(input);

  if (isAuthEndpoint(finalUrl)) {
    return nativeFetch(finalUrl, init);
  }

  const token = authService.getAccessToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await nativeFetch(finalUrl, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    try {
      await authService.refresh();
      const newToken = authService.getAccessToken();

      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await nativeFetch(finalUrl, { ...init, headers });
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

export function enableGlobalAuthFetch() {
  if (fetchPatched) return;

  nativeFetch = window.fetch.bind(window);
  fetchPatched = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (!authService.getAccessToken() || isAuthEndpoint(url)) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init?.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${authService.getAccessToken()}`);
    }

    let response = await nativeFetch(input, { ...init, headers });

    if (response.status === 401) {
      try {
        await authService.refresh();
        const newToken = authService.getAccessToken();
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await nativeFetch(input, { ...init, headers });
        }
      } catch {
        await authService.logout();
        window.location.href = '/login';
      }
    }

    return response;
  };
}

export function disableGlobalAuthFetch() {
  if (!fetchPatched) return;
  window.fetch = nativeFetch;
  fetchPatched = false;
}

export default apiFetch;

