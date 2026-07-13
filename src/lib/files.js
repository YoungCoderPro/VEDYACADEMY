// PDF file storage.
// Web: files live in IndexedDB as Blobs. Native: files are copied into the
// app's document directory. Both are addressed by a fileKey string.

import { Platform } from 'react-native';

const DB_NAME = 'vedyacademy-files';
const STORE = 'files';

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const webPut = async (key, blob) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

const webGet = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

const webDelete = async (key) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

// ---- public API ----

// asset: result from expo-document-picker ({ uri, name, file (web) })
export async function saveFile(fileKey, asset) {
  if (Platform.OS === 'web') {
    let blob = asset.file;
    if (!blob) {
      const res = await fetch(asset.uri);
      blob = await res.blob();
    }
    await webPut(fileKey, blob);
    return fileKey;
  }
  const FileSystem = require('expo-file-system/legacy');
  const dest = FileSystem.documentDirectory + fileKey;
  await FileSystem.copyAsync({ from: asset.uri, to: dest });
  return fileKey;
}

// Opens / downloads the file for the user.
export async function openFile(fileKey, displayName) {
  if (Platform.OS === 'web') {
    const blob = await webGet(fileKey);
    if (!blob) throw new Error('File not found in storage');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = displayName || fileKey;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return;
  }
  const FileSystem = require('expo-file-system/legacy');
  const Sharing = require('expo-sharing');
  const uri = FileSystem.documentDirectory + fileKey;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
  }
}

export async function deleteFile(fileKey) {
  try {
    if (Platform.OS === 'web') {
      await webDelete(fileKey);
    } else {
      const FileSystem = require('expo-file-system/legacy');
      await FileSystem.deleteAsync(FileSystem.documentDirectory + fileKey, { idempotent: true });
    }
  } catch (e) {
    // Deleting a missing file is fine.
  }
}
