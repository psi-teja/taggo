// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext({
  authToken: null,
  userRole: null,
  login: (token: string, role: string) => {},
  logout: () => {}
});

import { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);  // To store user role
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('role'); // or get it from cookies
    if (token && role) {
      setAuthToken(token);
      setUserRole(role);
    } else {
      setAuthToken(null);
      setUserRole(null);
    }
  }, []);

interface AuthContextType {
    authToken: string | null;
    userRole: string | null;
    login: (token: string, role: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    authToken: null,
    userRole: null,
    login: (token: string, role: string) => {},
    logout: () => {}
});

const login = (token: string, role: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('role', role);
    setAuthToken(token);
    setUserRole(role);
    router.push('/dashboard');
};

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    setAuthToken(null);
    setUserRole(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ authToken, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
