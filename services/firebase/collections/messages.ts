// services/firebase/collections/messages.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import { Message } from '../schema';
import { translateMessageToAll } from '../../translation';

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  attachmentUrl?: string,
  attachmentName?: string,
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
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
      readBy: [senderId],
      createdAt: now,
      updatedAt: now,
    });

    // Update conversation's last message preview
    const convRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: text.substring(0, 100),
      lastMessageAt: now,
      updatedAt: now,
    });

    // Trigger translation in background — don't await, non-blocking
    translateMessageToAll(conversationId, docRef.id, text).catch(console.error);

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
      .map(d => ({ id: d.id, ...d.data() } as Message))
      .reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Real-time listener — returns unsubscribe function
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
): Unsubscribe => {
  const q = query(
    collection(firestore, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    callback(messages);
  });
};

export const markAsRead = async (
  conversationId: string,
  messageId: string,
  userId: string,
): Promise<void> => {
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, { readBy: arrayUnion(userId) });
};

export const markAllRead = async (
  conversationId: string,
  userId: string,
): Promise<void> => {
  try {
    const q = query(
      collection(firestore, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const snapshot = await getDocs(q);
    const unread = snapshot.docs.filter(
      d => !((d.data().readBy as string[]) || []).includes(userId),
    );
    await Promise.all(
      unread.map(d =>
        updateDoc(d.ref, { readBy: arrayUnion(userId) }),
      ),
    );
    // Reset unread count on conversation
    const convRef = doc(firestore, 'conversations', conversationId);
    await updateDoc(convRef, { [`unreadCounts.${userId}`]: 0 });
  } catch (error) {
    console.error('Error marking all read:', error);
  }
};

export const saveTranslation = async (
  conversationId: string,
  messageId: string,
  lang: string,
  translatedText: string,
): Promise<void> => {
  const msgRef = doc(firestore, 'conversations', conversationId, 'messages', messageId);
  await updateDoc(msgRef, { [`translatedText.${lang}`]: translatedText });
};

export const deleteMessage = async (
  conversationId: string,
  messageId: string,
): Promise<void> => {
  await deleteDoc(doc(firestore, 'conversations', conversationId, 'messages', messageId));
};
