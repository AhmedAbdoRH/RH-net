'use client';
import { db } from '@/firebase';
import type { ContentIdea } from '@/lib/types';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const contentIdeasCollectionRef = collection(db, 'contentIdeas');

const ideaFromDoc = (doc: any): ContentIdea => {
  const data = doc.data();
  return {
    ...(data as Omit<ContentIdea, 'createdAt'>),
    id: doc.id,
    createdAt:
      (data.createdAt as Timestamp)?.toDate().toISOString() ||
      new Date().toISOString(),
  };
};

export const getContentIdeas = async (owner: string): Promise<ContentIdea[]> => {
  const q = query(
    contentIdeasCollectionRef,
    where('owner', '==', owner)
  );
  try {
    const data = await getDocs(q);
    return data.docs.map(ideaFromDoc).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (serverError: any) {
    const errorMessage = serverError?.message || '';
    const isPermissionError =
      errorMessage.includes('permission') ||
      errorMessage.includes('Permission') ||
      serverError?.code === 'permission-denied';

    if (isPermissionError) {
      const permissionError = new FirestorePermissionError({
        path: contentIdeasCollectionRef.path,
        operation: 'list',
      });
      errorEmitter.emit('permission-error', permissionError);
    } else {
      console.error('Firestore query error:', serverError);
    }
    return [];
  }
};

export const addContentIdea = async (text: string, owner: string): Promise<ContentIdea> => {
  try {
    const docRef = await addDoc(contentIdeasCollectionRef, {
      text,
      owner,
      createdAt: serverTimestamp(),
    });
    return {
      id: docRef.id,
      text,
      owner,
      createdAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Error adding content idea:', error?.code, error?.message);
    throw error;
  }
};

export const updateContentIdea = async (id: string, updates: Partial<ContentIdea>): Promise<void> => {
  const docRef = doc(db, 'contentIdeas', id);
  await updateDoc(docRef, updates);
};

export const deleteContentIdea = async (id: string): Promise<void> => {
  const docRef = doc(db, 'contentIdeas', id);
  await deleteDoc(docRef);
};