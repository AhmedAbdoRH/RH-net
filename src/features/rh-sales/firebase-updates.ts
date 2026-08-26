'use client';

import {
  addDoc,
  deleteDoc,
  updateDoc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';

export async function addDocumentNonBlocking(
  collectionRef: CollectionReference<DocumentData>,
  data: DocumentData,
) {
  try {
    return await addDoc(collectionRef, data);
  } catch (error) {
    console.error('[RH-sales] add document failed:', error);
    throw error;
  }
}

export function updateDocumentNonBlocking(
  documentRef: DocumentReference<DocumentData>,
  data: Record<string, unknown>,
) {
  void updateDoc(documentRef, data).catch((error) => {
    console.error('[RH-sales] update document failed:', error);
  });
}

export function deleteDocumentNonBlocking(documentRef: DocumentReference<DocumentData>) {
  void deleteDoc(documentRef).catch((error) => {
    console.error('[RH-sales] delete document failed:', error);
  });
}
