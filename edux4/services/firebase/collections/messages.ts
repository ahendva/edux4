// services/firebase/collections/messages.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  startAfter,
  increment,
} from 'firebase/firestore';
import { Message } from '../schema';

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  attachmentUrl?: string,
  attachmentType?: string,
): Promise<string> => {
  try {
    const now = Date.now();
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesRef, {
      conversationId,
      senderId,
      text,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      readBy: [senderId],
      createdAt: now,
      updatedAt: now,
    });

    // Update conversation's last message
    const convRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: text.substring(0, 100),
      lastMessageAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to send message: ${(error as Error).message}`);
  }
};

export const getMessages = async (
  conversationId: string,
  messageLimit = 50,
): Promise<Message[]> => {
  try {
    const messagesRef = collection(firestore, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Message))
      .reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

export const markAsRead = async (
  conversationId: string,
  messageId: string,
  userId: string,
): Promise<void> => {
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, {
    readBy: (await import('firebase/firestore')).arrayUnion(userId),
  });
};

export const deleteMessage = async (
  conversationId: string,
  messageId: string,
): Promise<void> => {
  await deleteDoc(doc(firestore, 'conversations', conversationId, 'messages', messageId));
};
