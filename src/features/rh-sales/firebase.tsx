'use client';

import { useEffect, useMemo, useState, type DependencyList, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import {
  onSnapshot,
  type CollectionReference,
  type DocumentData,
  type FirestoreError,
  type Query,
} from 'firebase/firestore';
import { app, db } from '@/firebase';

const auth = getAuth(app);

export type MemoizedFirestoreTarget =
  | (CollectionReference<DocumentData> & { __memo?: boolean })
  | (Query<DocumentData> & { __memo?: boolean })
  | null;

export function useAuth() {
  return auth;
}

export function useFirestore() {
  return db;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsUserLoading(false);
    });
  }, []);

  return { user, isUserLoading };
}

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(() => {
    const value = factory();
    if (value && typeof value === 'object') {
      try {
        Object.defineProperty(value, '__memo', {
          value: true,
          configurable: true,
        });
      } catch {
        // Firebase references are memoized by React even if the SDK object is sealed.
      }
    }
    return value;
  }, deps);
}

export function useCollection<T = unknown>(target: MemoizedFirestoreTarget) {
  const [data, setData] = useState<Array<T & { id: string }> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!target) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      target,
      (snapshot) => {
        setData(snapshot.docs.map((item) => ({ ...(item.data() as T), id: item.id })));
        setError(null);
        setIsLoading(false);
      },
      (snapshotError) => {
        setData(null);
        setError(snapshotError);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [target]);

  return { data, isLoading, error };
}

export function RhSalesProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      signInAnonymously(auth).catch((error) => {
        console.error('[RH-sales] anonymous sign-in failed:', error);
      });
    }
  }, [isUserLoading, user]);

  if (isUserLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">جاري تحميل مركز المبيعات...</div>;
  }

  return <>{children}</>;
}
