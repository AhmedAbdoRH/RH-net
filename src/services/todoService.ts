'use client';
import { db } from '@/firebase';
import type { Todo, Domain } from '@/lib/types';
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
  getDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const todosCollectionRef = collection(db, 'todos');
const domainsCollectionRef = collection(db, 'domains');
const topicsCollectionRef = collection(db, 'topics');

// Helper to convert Firestore timestamp to ISO string
const todoFromDoc = (doc: any): Todo => {
  const data = doc.data();
  return {
    ...(data as Omit<Todo, 'createdAt'>),
    id: doc.id,
    createdAt:
      (data.createdAt as Timestamp)?.toDate().toISOString() ||
      new Date().toISOString(),
    isHighPriority: data.isHighPriority || false,
    order: data.order || 0,
  };
};

export const getTodos = async (domainId: string): Promise<Todo[]> => {
  const q = query(
    todosCollectionRef,
    where('domainId', '==', domainId),
    orderBy('order', 'asc')
  );
  try {
    const data = await getDocs(q);
    return data.docs.map(todoFromDoc);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return [];
  }
};

export const getTodosForDomains = async (
  domainIds: string[]
): Promise<Record<string, Todo[]>> => {
  if (domainIds.length === 0) {
    return {};
  }
  const q = query(todosCollectionRef, where('domainId', 'in', domainIds));
  try {
    const data = await getDocs(q);
    const todos = data.docs.map(todoFromDoc);

    const todosByDomain: Record<string, Todo[]> = {};
    todos.forEach((todo) => {
      if (todo.domainId) {
        if (!todosByDomain[todo.domainId]) {
          todosByDomain[todo.domainId] = [];
        }
        todosByDomain[todo.domainId].push(todo);
      }
    });

    // Sort todos within each domain by order
    Object.keys(todosByDomain).forEach((key) => {
      todosByDomain[key].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    return todosByDomain;
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    return {};
  }
};

export const addTodo = (
  todo: Omit<Todo, 'id' | 'createdAt'>
): Promise<Todo> => {
  return new Promise(async (resolve, reject) => {
    const newTodoData = {
      ...todo,
      createdAt: serverTimestamp(),
      isHighPriority: todo.isHighPriority || false,
      order: todo.order || 0,
    };
    addDoc(todosCollectionRef, newTodoData)
      .then(async (docRef) => {
        const newDoc = await getDoc(docRef);
        resolve(todoFromDoc(newDoc));
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: todosCollectionRef.path,
          operation: 'create',
          requestResourceData: newTodoData,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const updateTodo = (
  id: string,
  updates: Partial<Omit<Todo, 'id'>>
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const todoDoc = doc(db, 'todos', id);
    updateDoc(todoDoc, updates)
      .then(() => {
        resolve();
      })
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: todoDoc.path,
          operation: 'update',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
        reject(permissionError);
      });
  });
};

export const deleteTodo = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const todoDoc = doc(db, 'todos', id);
        deleteDoc(todoDoc).then(() => {
            resolve();
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: todoDoc.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            reject(permissionError);
        });
    });
};

export const deleteTodosForDomain = async (domainId: string): Promise<void> => {
  try {
    const q = query(todosCollectionRef, where('domainId', '==', domainId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(docSnapshot =>
      deleteDoc(doc(db, 'todos', docSnapshot.id))
    );
    await Promise.all(deletePromises);
  } catch (serverError: any) {
    const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const GENERAL_TASKS_KEY = 'مهام عامة';

// New function to get all todos and group them by domain name
export const getAllTodosGroupedByDomain = async (): Promise<
  Record<string, Todo[]>
> => {
  // 1. Fetch all domains to create a map of ID -> Name
  const domainsSnapshot = await getDocs(domainsCollectionRef).catch(serverError => {
     const permissionError = new FirestorePermissionError({
      path: domainsCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  const domainMap = new Map<string, string>();
  domainsSnapshot.forEach((doc) => {
    const domainData = doc.data() as Domain;
    domainMap.set(doc.id, domainData.domainName);
  });

  // 2. Fetch all todos
  const todosQuery = query(todosCollectionRef, orderBy('order', 'asc'));
  const todosSnapshot = await getDocs(todosQuery).catch(serverError => {
     const permissionError = new FirestorePermissionError({
      path: todosCollectionRef.path,
      operation: 'list',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
  const todos = todosSnapshot.docs
    .map(todoFromDoc)
    .filter((todo) => !todo.completed);

  // 3. Group todos by domain name or as general tasks
  const groupedTodos: Record<string, Todo[]> = {
    [GENERAL_TASKS_KEY]: []
  };
  todos.forEach((todo) => {
    if (todo.domainId) {
        const domainName = domainMap.get(todo.domainId);
        if (domainName) {
            if (!groupedTodos[domainName]) {
                groupedTodos[domainName] = [];
            }
            groupedTodos[domainName].push(todo);
        }
    } else {
        // This is a general task
        groupedTodos[GENERAL_TASKS_KEY].push(todo);
    }
  });
  
  if(groupedTodos[GENERAL_TASKS_KEY].length === 0){
    delete groupedTodos[GENERAL_TASKS_KEY];
  }

  return groupedTodos;
};

export const reorderTodos = async (todos: Todo[]): Promise<void> => {
  const updatePromises = todos.map((todo, index) => {
    if (!todo.id) return Promise.resolve();
    return updateTodo(todo.id, { order: index });
  });

  await Promise.all(updatePromises);
};

export interface Topic {
  name: string;
  icon: string;
}

export const getTopics = async (): Promise<Topic[]> => {
  try {
    const q = query(topicsCollectionRef, orderBy('createdAt', 'desc'));
    const data = await getDocs(q);
    return data.docs.map(doc => doc.data() as Topic);
  } catch (serverError: any) {
    console.error('Error fetching topics:', serverError);
    return [];
  }
};

export const saveTopics = async (topics: Topic[]): Promise<void> => {
  try {
    // Clear existing topics first
    const existingSnapshot = await getDocs(topicsCollectionRef);
    const deletePromises = existingSnapshot.docs.map(docSnapshot =>
      deleteDoc(doc(db, 'topics', docSnapshot.id))
    );
    await Promise.all(deletePromises);

    // Add all topics
    const addPromises = topics.map(topic =>
      addDoc(topicsCollectionRef, { ...topic, createdAt: serverTimestamp() })
    );
    await Promise.all(addPromises);
  } catch (serverError: any) {
    console.error('Error saving topics:', serverError);
    throw serverError;
  }
};
