// services/firebase/collections/conversations.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Conversation } from '../schema';

export const createConversation = async (
  participantIds: string[],
  subject?: string,
  classroomId?: string,
): Promise<string> => {
  try {
    const now = Date.now();
    const unreadCounts: Record<string, number> = {};
    participantIds.forEach(id => { unreadCounts[id] = 0; });

    const docRef = await addDoc(collection(firestore, 'conversations'), {
      participantIds,
      classroomId: classroomId || null,
      subject: subject || '',
      lastMessage: '',
      lastMessageAt: now,
      unreadCounts,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create conversation: ${(error as Error).message}`);
  }
};

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const q = query(
      collection(firestore, 'conversations'),
      where('participantIds', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const snap = await getDoc(doc(firestore, 'conversations', conversationId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Conversation;
  } catch (error) {
    throw new Error(`Failed to get conversation: ${(error as Error).message}`);
  }
};

export const deleteConversation = async (conversationId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'conversations', conversationId));
};
