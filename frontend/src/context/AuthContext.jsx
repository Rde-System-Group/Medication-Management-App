import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedDoctor = localStorage.getItem('authDoctor');
    if (savedToken && savedDoctor) {
      setToken(savedToken);
      setDoctor(JSON.parse(savedDoctor));
    }
    setLoading(false);
  }, []);

  const login = (newToken, newDoctor) => {
    setToken(newToken);
    setDoctor(newDoctor);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authDoctor', JSON.stringify(newDoctor));
  };

  const logout = () => {
    setToken(null);
    setDoctor(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authDoctor');
  };

  return (
    <AuthContext.Provider value={{ token, doctor, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return React.useContext(AuthContext);
}
