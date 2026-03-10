// services/firebase/storageService.ts
import { storage, firestore } from './firebaseConfig';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  StorageReference,
  UploadTask,
} from 'firebase/storage';
import {
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';

function validateStoragePath(path: string): void {
  if (!path || typeof path !== 'string') {
    throw new Error('Storage path is required');
  }
  if (path.includes('..') || path.includes('\0') || path.startsWith('/')) {
    throw new Error('Invalid storage path');
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export const uploadFile = async (
  storagePath: string,
  fileBlob: Blob,
  onProgress?: (percent: number) => void,
  customMetadata?: Record<string, string>,
): Promise<string> => {
  try {
    validateStoragePath(storagePath);
    return await _upload(ref(storage, storagePath), fileBlob, onProgress, customMetadata);
  } catch (error) {
    throw new Error(`Failed to upload file: ${(error as Error).message}`);
  }
};

export const deleteFile = async (storagePath: string): Promise<void> => {
  try {
    validateStoragePath(storagePath);
    await deleteObject(ref(storage, storagePath));
  } catch (error) {
    throw new Error(`Failed to delete file: ${(error as Error).message}`);
  }
};

async function _upload(
  storageRef: StorageReference,
  fileBlob: Blob,
  onProgress?: (percent: number) => void,
  customMetadata?: Record<string, string>,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const uploadMetadata = customMetadata ? { customMetadata } : undefined;
    const task: UploadTask = uploadBytesResumable(storageRef, fileBlob, uploadMetadata);

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        }
      },
      (error) => reject(error),
      async () => {
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (err) {
          reject(err);
        }
      },
    );
  });
}
