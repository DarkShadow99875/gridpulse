const API_URL = 'http://localhost:8080/api/auth';

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number;
  mfaRequired: boolean;
  mfaMethod: string | null;
}

export interface TokenPayload {
  sub: string;
  roles?: string[];
  name?: string;
  exp: number;
}

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

function syncFromStorage() {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.message || data.error || 'Operazione non riuscita';
  } catch {
    return (await res.text()) || 'Operazione non riuscita';
  }
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  invitationToken?: string;
}

export interface InvitationInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export const authService = {
  async getInvitationInfo(token: string): Promise<InvitationInfo> {
    const res = await fetch(`${API_URL}/invitation/${token}`);

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    return res.json();
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    const data: AuthResponse = await res.json();

    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
    }

    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    const data: AuthResponse = await res.json();

    if (!data.mfaRequired && data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
    }

    return data;
  },

  async verifyMfa(email: string, code: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/mfa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      throw new Error(await parseError(res));
    }

    const data: AuthResponse = await res.json();

    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
    }

    return data;
  },

  async refresh(): Promise<string> {
    syncFromStorage();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await this.logout();
      throw new Error('Session expired');
    }

    const data: AuthResponse = await res.json();

    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    }

    await this.logout();
    throw new Error('Session expired');
  },

  async logout(): Promise<void> {
    syncFromStorage();
    const tokenToRevoke = refreshToken;

    if (tokenToRevoke) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokenToRevoke }),
        });
      } catch {
        // ignore
      }
    }

    clearTokens();
  },

  getAccessToken(): string | null {
    syncFromStorage();
    return accessToken;
  },

  getRefreshToken(): string | null {
    syncFromStorage();
    return refreshToken;
  },

  isAuthenticated(): boolean {
    syncFromStorage();
    if (!accessToken) return false;
    return !isTokenExpired(accessToken);
  },

  hasValidOrRefreshableSession(): boolean {
    syncFromStorage();
    if (accessToken && !isTokenExpired(accessToken)) return true;
    return !!refreshToken;
  },
};