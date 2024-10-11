import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  access_token: string | null;
  setAccessToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [access_token, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));

  return (
    <AuthContext.Provider value={{ access_token, setAccessToken }}>
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
