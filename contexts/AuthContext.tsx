'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from database
        const userRef = ref(database, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
          const userData = snapshot.val();
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.name,
            role: userData.role,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          };
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user');
        
        // Redirect to login if not authenticated and not on login page
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
