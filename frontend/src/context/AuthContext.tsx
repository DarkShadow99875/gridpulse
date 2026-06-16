import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authService, decodeToken, RegisterPayload } from '../services/authService';
import { enableGlobalAuthFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  email: string | null;
  displayName: string | null;
  roles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; mfaMethod: string | null }>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyMfa: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractRolesFromToken(token: string): string[] {
  const payload = decodeToken(token);
  if (!payload) return [];
  const roleList = payload.roles || [];
  return Array.isArray(roleList) ? roleList : [];
}

function extractUserFromToken(token: string): { email: string; displayName: string | null } {
  const payload = decodeToken(token);
  return {
    email: payload?.sub || '',
    displayName: payload?.name || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const applySession = useCallback((token: string | null) => {
    if (token) {
      enableGlobalAuthFetch();
      const user = extractUserFromToken(token);
      setEmail(user.email || null);
      setDisplayName(user.displayName);
      setRoles(extractRolesFromToken(token));
      setIsAuthenticated(true);
    } else {
      setEmail(null);
      setDisplayName(null);
      setRoles([]);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        let token = authService.getAccessToken();

        if (token && authService.isAuthenticated()) {
          applySession(token);
        } else if (authService.getRefreshToken()) {
          token = await authService.refresh();
          applySession(token);
        } else {
          await authService.logout();
          applySession(null);
        }
      } catch {
        await authService.logout();
        applySession(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [applySession]);

  const login = async (emailInput: string, password: string) => {
    const response = await authService.login(emailInput, password);

    if (!response.mfaRequired && response.accessToken) {
      applySession(response.accessToken);
    }

    return {
      mfaRequired: response.mfaRequired,
      mfaMethod: response.mfaMethod,
    };
  };

  const register = async (payload: RegisterPayload) => {
    const response = await authService.register(payload);
    if (response.accessToken) {
      applySession(response.accessToken);
    }
  };

  const verifyMfa = async (emailInput: string, code: string) => {
    const response = await authService.verifyMfa(emailInput, code);
    if (response.accessToken) {
      applySession(response.accessToken);
    }
  };

  const logout = async () => {
    await authService.logout();
    applySession(null);
    navigate('/login');
  };

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (requiredRoles: string[]) => requiredRoles.some((r) => roles.includes(r));

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        email,
        displayName,
        roles,
        hasRole,
        hasAnyRole,
        login,
        register,
        verifyMfa,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};