
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  "projectId": "domainview",
  "appId": "1:226934922867:web:db492564c92b9b95f79406",
  "storageBucket": "domainview.firebasestorage.app",
  "apiKey": "AIzaSyA-AuKkPZiuQdA-NIPjObheWabwnrqwG7g",
  "authDomain": "domainview.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "226934922867"
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
