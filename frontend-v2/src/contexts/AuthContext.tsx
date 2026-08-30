import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  switchRoleQuick: (role: UserRole) => Promise<void>;
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
      const data = await api.get('/auth/me', { token: currentToken });
      setUser(data.user);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);

    // Navigate to role workspace
    switch (newUser.role) {
      case 'GOVERNMENT_ADMIN':
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

  const switchRoleQuick = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      GOVERNMENT_ADMIN: 'admin@maha.gov.in',
      COURSE_MANAGER: 'coursemanager@maha.gov.in',
      TRAINING_PROVIDER: 'provider@maha.gov.in',
      TRAINER: 'trainer@maha.gov.in',
      TRAINEE: 'trainee@maha.gov.in',
      EMPLOYER: 'employer@maha.gov.in',
    };

    const targetEmail = emailMap[role];
    if (!targetEmail) return;

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email: targetEmail, password: 'password123' });
      if (res.token && res.user) {
        login(res.token, res.user);
      }
    } catch (err) {
      console.error('Quick role switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRoleQuick, loading, refreshUser }}>
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
