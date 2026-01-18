const DB_NAME = "d2m_uploads";
const STORE_NAME = "files";
const STORAGE_KEY = "d2m_pending_uploads";

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "uploadId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = action(store);
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveUploadFile(uploadId, file, meta = {}) {
  if (!isBrowser() || !uploadId || !file) return;
  const record = {
    uploadId,
    file,
    meta,
    updatedAt: Date.now(),
  };
  await withStore("readwrite", (store) => store.put(record));
}

export async function loadUploadFile(uploadId) {
  if (!isBrowser() || !uploadId) return null;
  try {
    const result = await withStore("readonly", (store) =>
      store.get(uploadId)
    );
    return result || null;
  } catch (e) {
    return null;
  }
}

export async function deleteUploadFile(uploadId) {
  if (!isBrowser() || !uploadId) return;
  try {
    await withStore("readwrite", (store) => store.delete(uploadId));
  } catch (e) {
    // Ignore delete errors
  }
}

export function getPendingUploads() {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function addPendingUpload(uploadId, meta = {}) {
  if (!isBrowser() || !uploadId) return;
  const current = getPendingUploads();
  current[uploadId] = { ...meta, uploadId, updatedAt: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    // Ignore storage errors
  }
}

export function removePendingUpload(uploadId) {
  if (!isBrowser() || !uploadId) return;
  const current = getPendingUploads();
  if (!current[uploadId]) return;
  delete current[uploadId];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    // Ignore storage errors
  }
}
