'use client';

import type { Customer, KnowledgeBaseArticle, Skill } from './types';
import {
  collection,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc,
  type Firestore,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  getCountFromServer
} from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/features/rh-sales/firebase-updates';

type UpdatableCustomerData = Partial<Omit<Customer, 'id' | 'addedDate' | 'email'>>;

const normalizePhones = (phones?: string[], primaryPhone?: string) => {
  const values = [...(phones ?? []), primaryPhone ?? '']
    .map((phone) => phone.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
};

export const addCustomer = async (firestore: Firestore, customer: Partial<Omit<Customer, 'id' | 'addedDate'>>) => {
  const customerCollection = collection(firestore, 'customers');
  const placeholderEmail = `${customer.name?.toLowerCase().replace(/\s/g, '.')}@placeholder.email`;
  
  // Get the current number of customers to determine the next displayOrder
  const snapshot = await getDocs(customerCollection);
  const currentCount = snapshot.size;
  const phones = normalizePhones(customer.phones, customer.phone);
  
  const newCustomer = {
    name: customer.name || "Unnamed Customer",
    email: customer.email || placeholderEmail,
    company: customer.company || '',
    phone: phones[0] || '',
    phones,
    website: customer.website || '',
    generalInfo: customer.generalInfo || '',
    needs: customer.needs || '',
    customerConcerns: customer.customerConcerns || '',
    addedDate: Timestamp.now(),
    displayOrder: currentCount,
    bestTimeToContact: customer.bestTimeToContact || '',
    convictionScore: 1, // Default conviction score
  };
  await addDocumentNonBlocking(customerCollection, newCustomer);
};

export const updateCustomer = (firestore: Firestore, customerId: string, data: UpdatableCustomerData) => {
  const customerDoc = doc(firestore, 'customers', customerId);
  updateDocumentNonBlocking(customerDoc, data);
};

export const updateConvictionScore = (firestore: Firestore, customerId: string, currentScore: number, delta: 1 | -1) => {
  const newScore = currentScore + delta;
  if (newScore >= 1 && newScore <= 5) {
    const customerDoc = doc(firestore, 'customers', customerId);
    updateDocumentNonBlocking(customerDoc, { convictionScore: newScore });
  }
};

export const deleteCustomer = async (firestore: Firestore, customerId: string, customers?: Customer[]) => {
    const customerDoc = doc(firestore, 'customers', customerId);
    await deleteDoc(customerDoc);

    if (customers) {
        // After deletion, re-order the remaining customers
        const remainingCustomers = customers.filter(c => c.id !== customerId).sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
        
        const batch = writeBatch(firestore);
        remainingCustomers.forEach((customer, index) => {
            const docRef = doc(firestore, 'customers', customer.id);
            batch.update(docRef, { displayOrder: index });
        });

        await batch.commit();
    }
};

export const moveCustomer = async (firestore: Firestore, customers: Customer[], customerId: string, direction: 'left' | 'right') => {
  const sortedCustomers = customers.sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
  const currentIndex = sortedCustomers.findIndex(c => c.id === customerId);

  if (currentIndex === -1) return;

  const newIndex = direction === 'right' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex < 0 || newIndex >= sortedCustomers.length) {
    return; // Already at the end or beginning
  }

  const customerToMove = sortedCustomers[currentIndex];
  const otherCustomer = sortedCustomers[newIndex];

  if (!customerToMove || !otherCustomer) return;

  const orderToMove = customerToMove.displayOrder ?? currentIndex;
  const orderToSwap = otherCustomer.displayOrder ?? newIndex;

  const batch = writeBatch(firestore);

  const movedCustomerRef = doc(firestore, 'customers', customerToMove.id);
  batch.update(movedCustomerRef, { displayOrder: orderToSwap });

  const otherCustomerRef = doc(firestore, 'customers', otherCustomer.id);
  batch.update(otherCustomerRef, { displayOrder: orderToMove });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error moving customer:", error);
  }
};

export const addConcern = (firestore: Firestore, customerId: string, concernText: string, summary: string, category: string) => {
    const concernsCollection = collection(firestore, 'customers', customerId, 'concerns');
    const newConcern = {
        date: Timestamp.now(),
        originalText: concernText,
        summary: summary,
        category: category,
        status: 'analyzed',
        customerId: customerId,
    };
    addDocumentNonBlocking(concernsCollection, newConcern);
};

export const addKnowledgeBaseArticle = async (firestore: Firestore, article: Partial<Omit<KnowledgeBaseArticle, 'id'>>) => {
  const articleCollection = collection(firestore, 'knowledge_base_articles');
  const snapshot = await getDocs(articleCollection);
  const currentCount = snapshot.size;

  const newArticle = {
    title: article.title || 'بدون عنوان',
    content: article.content || '',
    category: article.category || 'عام',
    tags: article.tags || [],
    displayOrder: currentCount,
  };
  await addDocumentNonBlocking(articleCollection, newArticle);
};

export const updateKnowledgeBaseArticle = (firestore: Firestore, articleId: string, data: Partial<Omit<KnowledgeBaseArticle, 'id' | 'displayOrder'>>) => {
    const articleDoc = doc(firestore, 'knowledge_base_articles', articleId);
    updateDocumentNonBlocking(articleDoc, data);
};

export const deleteKnowledgeBaseArticle = async (firestore: Firestore, articleId: string, articles?: KnowledgeBaseArticle[]) => {
    const articleDoc = doc(firestore, 'knowledge_base_articles', articleId);
    await deleteDoc(articleDoc);

    if (articles) {
        const remaining = articles.filter(a => a.id !== articleId).sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
        const batch = writeBatch(firestore);
        remaining.forEach((article, index) => {
            const docRef = doc(firestore, 'knowledge_base_articles', article.id);
            batch.update(docRef, { displayOrder: index });
        });
        await batch.commit();
    }
};

export const moveKnowledgeBaseArticle = async (firestore: Firestore, articles: KnowledgeBaseArticle[], articleId: string, direction: 'left' | 'right') => {
  const sorted = [...articles].sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
  const currentIndex = sorted.findIndex(a => a.id === articleId);

  if (currentIndex === -1) return;
  // For RTL: 'right' arrow moves to a lower index, 'left' arrow moves to a higher index.
  const newIndex = direction === 'right' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex < 0 || newIndex >= sorted.length) return; // Already at an end

  // Create a new array with the moved item
  const newSortedList = Array.from(sorted);
  const [movedItem] = newSortedList.splice(currentIndex, 1);
  newSortedList.splice(newIndex, 0, movedItem);

  // Now, update the displayOrder for all items in the new list
  const batch = writeBatch(firestore);
  newSortedList.forEach((article, index) => {
    const docRef = doc(firestore, 'knowledge_base_articles', article.id);
    batch.update(docRef, { displayOrder: index });
  });

  await batch.commit();
};

export const addSkill = async (firestore: Firestore, skill: Omit<Skill, 'id'>) => {
  const skillCollection = collection(firestore, 'skills');
  const snapshot = await getDocs(skillCollection);
  const currentCount = snapshot.size;

  const newSkill = {
      ...skill,
      displayOrder: currentCount
  }
  await addDocumentNonBlocking(skillCollection, newSkill);
};

export const updateSkill = (firestore: Firestore, skillId: string, data: Partial<Omit<Skill, 'id'>>) => {
    const skillDoc = doc(firestore, 'skills', skillId);
    updateDocumentNonBlocking(skillDoc, data);
};

export const deleteSkill = async (firestore: Firestore, skillId: string, skills?: Skill[]) => {
    const skillDoc = doc(firestore, 'skills', skillId);
    await deleteDoc(skillDoc);

    if (skills) {
        const remaining = skills.filter(s => s.id !== skillId).sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
        const batch = writeBatch(firestore);
        remaining.forEach((skill, index) => {
            const docRef = doc(firestore, 'skills', skill.id);
            batch.update(docRef, { displayOrder: index });
        });
        await batch.commit();
    }
};

export const moveSkill = async (firestore: Firestore, skills: Skill[], skillId: string, direction: 'left' | 'right') => {
  const sorted = skills.sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity));
  const currentIndex = sorted.findIndex(s => s.id === skillId);

  if (currentIndex === -1) return;
  const newIndex = direction === 'right' ? currentIndex - 1 : currentIndex + 1; // RTL
  if (newIndex < 0 || newIndex >= sorted.length) return;

  const skillToMove = sorted[currentIndex];
  const otherSkill = sorted[newIndex];

  if (!skillToMove || !otherSkill) return;

  const batch = writeBatch(firestore);
  const orderToMove = skillToMove.displayOrder ?? currentIndex;
  const orderToSwap = otherSkill.displayOrder ?? newIndex;

  batch.update(doc(firestore, 'skills', skillToMove.id), { displayOrder: orderToSwap });
  batch.update(doc(firestore, 'skills', otherSkill.id), { displayOrder: orderToMove });

  await batch.commit();
};
