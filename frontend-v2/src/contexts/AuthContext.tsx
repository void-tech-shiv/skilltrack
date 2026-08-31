import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    if (!location.pathname.startsWith('/verify')) {
      navigate('/login');
    }
  }, [navigate, location.pathname]);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/auth/me');
      if (data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        logout();
      } else {
        console.error('Failed to fetch user due to server error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, [token, refreshUser]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);

    // Route dynamically based on authentic user role
    switch (newUser.role) {
      case 'GOVERNMENT_ADMIN':
      case 'ANALYST':
        navigate('/admin');
        break;
      case 'COURSE_MANAGER':
        navigate('/course-manager');
        break;
      case 'TRAINING_PROVIDER':
        navigate('/provider');
        break;
      case 'TRAINER':
        navigate('/teacher');
        break;
      case 'TRAINEE':
        navigate('/learner');
        break;
      case 'EMPLOYER':
        navigate('/employer');
        break;
      default:
        navigate('/admin');
        break;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, refreshUser }}>
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
