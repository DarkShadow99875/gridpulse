import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { enableGlobalAuthFetch } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  roles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to decode JWT and extract roles (simple base64 decode)
  const extractRolesFromToken = (token: string): string[] => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // We expect roles to come either as "roles" or "authorities"
      const roleList = payload.roles || payload.authorities || [];
      if (Array.isArray(roleList)) {
        return roleList.map((r: any) => typeof r === 'string' ? r : r.authority || r);
      }
      return [];
    } catch {
      return [];
    }
  };

  const updateAuthState = (token: string | null) => {
    if (token) {
      enableGlobalAuthFetch();
      const extractedRoles = extractRolesFromToken(token);
      setRoles(extractedRoles);
      setIsAuthenticated(true);
    } else {
      setRoles([]);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    const token = authService.getAccessToken();
    updateAuthState(token);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    updateAuthState(response.accessToken);
  };

  const logout = async () => {
    await authService.logout();
    setRoles([]);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const hasRole = (role: string) => roles.includes(role);
  const hasAnyRole = (requiredRoles: string[]) => requiredRoles.some(r => roles.includes(r));

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        roles, 
        hasRole, 
        hasAnyRole,
        login, 
        logout, 
        loading 
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

