
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'demo-domainview-project',
  appId: process.env.FIREBASE_APP_ID || 'demo-app-id',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'demo-domainview.firebasestorage.app',
  apiKey: process.env.FIREBASE_API_KEY || 'demo-firebase-api-key',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'demo-domainview.firebaseapp.com',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '000000000000',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportCollection(collectionName: string) {
  console.log(`Exporting ${collectionName}...`);
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

async function runBackup() {
  try {
    const collections = ['domains', 'todos', 'faults', 'general'];
    const backupData: any = {};

    for (const col of collections) {
      backupData[col] = await exportCollection(col);
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `firestore_backup_${timestamp}.json`;
    const filePath = path.join(process.cwd(), fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    console.log(`Backup completed successfully! Saved to: ${fileName}`);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

runBackup();
