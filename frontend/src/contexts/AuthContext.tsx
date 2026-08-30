import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export type UserRole = 
  | 'GOVERNMENT_ADMIN' 
  | 'ANALYST' 
  | 'COURSE_MANAGER' 
  | 'TRAINEE' 
  | 'EMPLOYER' 
  | 'TRAINING_PROVIDER' 
  | 'TRAINER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  emailVerified?: boolean;
  organizationId?: string;
  organizationName?: string;
  traineeId?: string;
  trainerId?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const logout = React.useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('Invalid token');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        logout();
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);

    // Route dynamically based on user role
    switch (newUser.role) {
      case 'GOVERNMENT_ADMIN':
        navigate('/admin');
        break;
      case 'COURSE_MANAGER':
        navigate('/course-manager');
        break;
      case 'TRAINER':
        navigate('/trainer-portal');
        break;
      case 'TRAINING_PROVIDER':
        navigate('/provider-portal');
        break;
      case 'TRAINEE':
        navigate('/trainee-portal');
        break;
      case 'EMPLOYER':
        navigate('/employer-portal');
        break;
      case 'ANALYST':
      default:
        navigate('/dashboard');
        break;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
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
