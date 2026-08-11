// This is intentionally safe for client-side use, but the actual values should be provided
// from environment variables in production. Keep placeholders here to avoid leaking secrets.
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-domainview-project',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-domainview.firebasestorage.app',
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-firebase-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-domainview.firebaseapp.com',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
};
