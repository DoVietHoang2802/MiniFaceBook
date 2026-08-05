import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authService } from '../../modules/auth/services/authService';
import type { UserResponse } from '../../modules/auth/services/authService';

interface AuthContextType {
  user: UserResponse | null;
  setUser: React.Dispatch<React.SetStateAction<UserResponse | null>>;
  isCheckingAuth: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserResponse | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const authGenerationRef = useRef(0);

  const setUser: React.Dispatch<React.SetStateAction<UserResponse | null>> = (value) => {
    authGenerationRef.current += 1;
    setUserState(value);
  };

  useEffect(() => {
    const requestGeneration = authGenerationRef.current;

    authService.getMe()
      .then((response) => {
        const loggedInUser = response.data;
        if (authGenerationRef.current === requestGeneration && loggedInUser?.email) {
          setUserState(loggedInUser);
        }
      })
      .catch(() => {
        // Ignore a bootstrap request that completed after a newer login/logout action.
        if (authGenerationRef.current === requestGeneration) {
          setUserState(null);
        }
      })
      .finally(() => {
        setIsCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      authGenerationRef.current += 1;
      setUserState(null);
    };
    window.addEventListener('unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('unauthorized', handleUnauthorized);
    };
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Local logout must still succeed when a session has already expired.
    } finally {
      authGenerationRef.current += 1;
      setUserState(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isCheckingAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
