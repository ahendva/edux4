// services/firebase/collections/connections.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ConnectionRequest, ConnectionStatus } from '../schema';
import { addConnection } from './users';

export const sendConnectionRequest = async (
  fromUserId: string,
  toUserId: string,
  message?: string,
): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(firestore, 'connectionRequests'), {
    fromUserId,
    toUserId,
    status: 'pending' as ConnectionStatus,
    message: message || '',
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getPendingRequests = async (userId: string): Promise<ConnectionRequest[]> => {
  try {
    const q = query(
      collection(firestore, 'connectionRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConnectionRequest));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }
};

export const acceptConnectionRequest = async (requestId: string): Promise<void> => {
  const docRef = doc(firestore, 'connectionRequests', requestId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('Request not found');

  const request = snap.data() as ConnectionRequest;
  await updateDoc(docRef, { status: 'accepted', updatedAt: Date.now() });
  await addConnection(request.fromUserId, request.toUserId);
};

export const rejectConnectionRequest = async (requestId: string): Promise<void> => {
  const docRef = doc(firestore, 'connectionRequests', requestId);
  await updateDoc(docRef, { status: 'rejected', updatedAt: Date.now() });
};
