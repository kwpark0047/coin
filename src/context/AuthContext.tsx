import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface User {
  nickname: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (nickname: string, email: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((nickname: string, email: string) => {
    const u = { nickname, email };
    setUser(u);
    localStorage.setItem('auth-user', JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('auth-user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
