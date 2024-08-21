import { createContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'account';

export const AuthContext = createContext({
  account: null,
  isLoggedIn: false,
  setAccount: () => {},
  logout: () => {},
});

export default function AuthProvider({ children }) {
  const [account, setAcc] = useState(null);

  // Check for existing user data in localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser) setAcc(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // To prevent corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setAccount = (account) => {
    setAcc(account);
    console.log('set', account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  };

  const logout = () => {
    setAcc(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    account,
    isLoggedIn: Boolean(account),
    setAccount,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
