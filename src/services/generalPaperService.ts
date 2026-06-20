"use client";
import { db } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const paperDocRef = doc(db, 'general', 'paper');

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt?: string;
}

const createNoteId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeUpdatedAt = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return '';
};

export const getGeneralPaper = async (): Promise<Note[]> => {
  try {
    const docSnap = await getDoc(paperDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const notesData = data.notes as Note[] || [];

      if (!notesData.length && typeof data.content === 'string' && data.content.trim()) {
        return [{
          id: createNoteId(),
          title: 'ملاحظة عامة',
          content: data.content,
          updatedAt: normalizeUpdatedAt(data.updatedAt),
        }];
      }

      return notesData.map(note => ({
        id: note.id || createNoteId(),
        title: note.title || '',
        content: note.content || '',
        updatedAt: normalizeUpdatedAt(note.updatedAt),
      }));
    }
    return [];
  } catch (serverError) {
    const permissionError = new FirestorePermissionError({
      path: paperDocRef.path,
      operation: 'get',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const saveGeneralPaper = (notes: Note[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const data = {
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt || new Date().toISOString(),
      })),
      updatedAt: new Date().toISOString(),
    };
    setDoc(paperDocRef, data, { merge: true })
      .then(() => {
        resolve();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: paperDocRef.path,
          operation: 'update',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};
