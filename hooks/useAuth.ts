import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  phoneNumber: string | null;
}

/**
 * Custom hook for centralized authentication state management
 * Replaces scattered auth checks across components
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      
      if (currentUser) {
        console.log('[useAuth] User authenticated');
        // Sync with localStorage
        localStorage.setItem('user_phone', currentUser.phoneNumber || '');
        localStorage.setItem('user_uid', currentUser.uid);
        localStorage.setItem('user_authenticated', 'true');
      } else {
        console.log('[useAuth] User not authenticated');
        // Clear localStorage
        localStorage.removeItem('user_phone');
        localStorage.removeItem('user_uid');
        localStorage.removeItem('user_authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    phoneNumber: user?.phoneNumber || null,
  };
}

/**
 * Utility function to sign out user
 */
export async function signOutUser(): Promise<void> {
  await auth.signOut();
  
  // Clear all user-related localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('userProfile');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('user_phone');
  localStorage.removeItem('user_uid');
  localStorage.removeItem('user_authenticated');
  
  // Clear any cached snapshot data
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('psychSnapshot_')) {
      localStorage.removeItem(key);
    }
  });
}
