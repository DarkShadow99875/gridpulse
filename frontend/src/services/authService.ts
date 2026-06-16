const API_URL = 'http://localhost:8080/api/auth';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Login failed');
    }

    const data: AuthResponse = await res.json();

    accessToken = data.accessToken;
    refreshToken = data.refreshToken;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return data;
  },

  async refresh(): Promise<string> {
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      this.logout();
      throw new Error('Session expired');
    }

    const data: AuthResponse = await res.json();

    accessToken = data.accessToken;
    refreshToken = data.refreshToken;

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return accessToken;
  },

  async logout(): Promise<void> {
    if (refreshToken) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (_) {
        // ignore
      }
    }

    accessToken = null;
    refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getAccessToken(): string | null {
    return accessToken;
  },

  isAuthenticated(): boolean {
    return !!accessToken;
  },
};
