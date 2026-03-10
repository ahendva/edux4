// services/firebase/firebaseDebug.ts
import { firestore } from './firebaseConfig';
import { collection } from 'firebase/firestore';

export const debugFirestore = () => {
  console.log('Firestore instance type:', typeof firestore);
  console.log('Firestore instance:', firestore);

  return {
    isValid: typeof firestore === 'object' && firestore !== null,
  };
};

export const testCollection = (path: string): boolean => {
  try {
    const collectionRef = collection(firestore, path);
    console.log('Collection reference created successfully for path:', path);
    return true;
  } catch (error) {
    console.error(`Failed to create collection reference for path: ${path}`, error);
    return false;
  }
};

export default { debugFirestore, testCollection };
