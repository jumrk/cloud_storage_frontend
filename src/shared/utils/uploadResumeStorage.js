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

/**
 * ✅ HIGH FIX: Store only metadata, NOT the entire File blob
 * 
 * Problem: Storing entire File object (potentially GB) causes browser quota issues
 * Solution: Store lightweight metadata only (name, size, type, lastModified)
 * 
 * Trade-off: Cannot auto-resume upload without user re-selecting file
 * This is acceptable for large files (better than quota errors)
 * 
 * @param {string} uploadId - Upload session ID
 * @param {File} file - File object (only metadata will be stored)
 * @param {object} meta - Additional metadata
 */
export async function saveUploadFile(uploadId, file, meta = {}) {
  if (!isBrowser() || !uploadId || !file) return;
  
  // ✅ Extract only lightweight metadata (no blob storage)
  const fileMetadata = {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    webkitRelativePath: file.webkitRelativePath || "",
  };
  
  const record = {
    uploadId,
    fileMetadata, // Store metadata only (few KB max)
    // file: file, // ❌ REMOVED - Don't store File blob (can be GB)
    meta,
    updatedAt: Date.now(),
    _resumable: false, // Cannot auto-resume without re-selecting file
  };
  
  await withStore("readwrite", (store) => store.put(record));
}

/**
 * ✅ HIGH FIX: Load upload metadata (file blob not stored)
 * 
 * Returns:
 * {
 *   uploadId: string,
 *   fileMetadata: { name, size, type, lastModified, webkitRelativePath },
 *   meta: object,
 *   updatedAt: timestamp,
 *   _resumable: false // File blob not available for auto-resume
 * }
 * 
 * Note: Caller must handle file re-selection for resume
 */
export async function loadUploadFile(uploadId) {
  if (!isBrowser() || !uploadId) return null;
  try {
    const result = await withStore("readonly", (store) =>
      store.get(uploadId)
    );
    
    if (!result) return null;
    
    // Check if this is old format (with File blob) - migrate to new format
    if (result.file && !result.fileMetadata) {
      console.warn(
        `[uploadResumeStorage] Old format detected for ${uploadId}, migrating to metadata-only`
      );
      
      // Extract metadata from old File object
      result.fileMetadata = {
        name: result.file.name,
        size: result.file.size,
        type: result.file.type,
        lastModified: result.file.lastModified,
        webkitRelativePath: result.file.webkitRelativePath || "",
      };
      
      // Remove File blob
      delete result.file;
      result._resumable = false;
      
      // Save migrated version
      try {
        await withStore("readwrite", (store) => store.put(result));
      } catch (migrateErr) {
        console.warn(`[uploadResumeStorage] Migration save failed:`, migrateErr);
      }
    }
    
    return result;
  } catch (e) {
    console.error(`[uploadResumeStorage] Load error:`, e);
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

/**
 * ✅ HIGH FIX: Cleanup old upload records to prevent storage bloat
 * 
 * Removes records older than specified age (default 7 days)
 * Call this periodically or on app init
 * 
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 7 days)
 * @returns {Promise<number>} Number of records deleted
 */
export async function cleanupOldRecords(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  if (!isBrowser()) return 0;
  
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const allRequest = store.getAll();
    
    return new Promise((resolve, reject) => {
      allRequest.onsuccess = () => {
        const records = allRequest.result || [];
        const now = Date.now();
        let deletedCount = 0;
        
        records.forEach((record) => {
          const age = now - (record.updatedAt || 0);
          if (age > maxAgeMs) {
            store.delete(record.uploadId);
            deletedCount++;
          }
        });
        
        tx.oncomplete = () => {
          if (deletedCount > 0) {
            console.log(
              `[uploadResumeStorage] Cleaned up ${deletedCount} old records (> ${Math.floor(maxAgeMs / 86400000)} days)`
            );
          }
          resolve(deletedCount);
        };
        
        tx.onerror = () => reject(tx.error);
      };
      
      allRequest.onerror = () => reject(allRequest.error);
    });
  } catch (e) {
    console.error(`[uploadResumeStorage] Cleanup error:`, e);
    return 0;
  }
}

/**
 * ✅ HIGH FIX: Get storage usage estimate
 * 
 * Returns estimated storage used by upload records
 * Useful for monitoring and preventing quota issues
 * 
 * @returns {Promise<{count: number, estimatedBytes: number}>}
 */
export async function getStorageUsage() {
  if (!isBrowser()) return { count: 0, estimatedBytes: 0 };
  
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const allRequest = store.getAll();
    
    return new Promise((resolve, reject) => {
      allRequest.onsuccess = () => {
        const records = allRequest.result || [];
        
        // Estimate size (JSON stringified size)
        let estimatedBytes = 0;
        records.forEach((record) => {
          try {
            estimatedBytes += JSON.stringify(record).length * 2; // UTF-16 = 2 bytes per char
          } catch (e) {
            // Skip records that can't be stringified
          }
        });
        
        resolve({
          count: records.length,
          estimatedBytes,
          estimatedKB: Math.round(estimatedBytes / 1024),
          estimatedMB: (estimatedBytes / 1024 / 1024).toFixed(2),
        });
      };
      
      allRequest.onerror = () => reject(allRequest.error);
    });
  } catch (e) {
    console.error(`[uploadResumeStorage] Usage check error:`, e);
    return { count: 0, estimatedBytes: 0 };
  }
}

/**
 * ✅ FIX L3: Background migration of all old format records
 * 
 * Migrates all records with File blobs to metadata-only format
 * Should be called once on app initialization
 * Runs in background, doesn't block UI
 * 
 * @returns {Promise<{migrated: number, skipped: number, failed: number}>}
 */
export async function migrateAllOldRecords() {
  if (!isBrowser()) {
    return { migrated: 0, skipped: 0, failed: 0 };
  }
  
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const allRequest = store.getAll();
    
    return new Promise((resolve, reject) => {
      allRequest.onsuccess = () => {
        const records = allRequest.result || [];
        let migrated = 0;
        let skipped = 0;
        let failed = 0;
        
        console.log(
          `[uploadResumeStorage] Starting background migration of ${records.length} records...`
        );
        
        records.forEach((record) => {
          try {
            // Check if record needs migration (has File blob)
            if (record.file && !record.fileMetadata) {
              // Extract metadata from File blob
              const fileMetadata = {
                name: record.file.name,
                size: record.file.size,
                type: record.file.type,
                lastModified: record.file.lastModified,
                webkitRelativePath: record.file.webkitRelativePath || "",
              };
              
              // Update record
              const migratedRecord = {
                ...record,
                fileMetadata,
                _resumable: false,
                _migrated: true,
                _migratedAt: Date.now(),
              };
              
              // Remove File blob
              delete migratedRecord.file;
              
              // Save migrated record
              store.put(migratedRecord);
              migrated++;
            } else if (record.fileMetadata) {
              // Already migrated or new format
              skipped++;
            } else {
              // Invalid record format
              console.warn(
                `[uploadResumeStorage] Invalid record format: ${record.uploadId}`
              );
              skipped++;
            }
          } catch (recordErr) {
            console.error(
              `[uploadResumeStorage] Migration failed for record ${record.uploadId}:`,
              recordErr
            );
            failed++;
          }
        });
        
        tx.oncomplete = () => {
          const result = { migrated, skipped, failed };
          
          if (migrated > 0) {
            console.log(
              `[uploadResumeStorage] ✅ Background migration completed:`,
              result
            );
          } else if (records.length > 0) {
            console.log(
              `[uploadResumeStorage] ✅ No records need migration (${skipped} already migrated)`
            );
          }
          
          resolve(result);
        };
        
        tx.onerror = () => reject(tx.error);
      };
      
      allRequest.onerror = () => reject(allRequest.error);
    });
  } catch (e) {
    console.error(`[uploadResumeStorage] Background migration error:`, e);
    return { migrated: 0, skipped: 0, failed: 0 };
  }
}

/**
 * ✅ FIX L3: Initialize storage (cleanup + migration)
 * 
 * Call this once on app initialization to:
 * 1. Cleanup old records (> 7 days)
 * 2. Migrate old format records to metadata-only
 * 
 * Runs asynchronously, doesn't block app startup
 */
export async function initUploadStorage() {
  if (!isBrowser()) return;
  
  try {
    // Step 1: Cleanup old records first (free space)
    const cleaned = await cleanupOldRecords();
    
    // Step 2: Migrate remaining records to new format
    const migrationResult = await migrateAllOldRecords();
    
    // Step 3: Log final stats
    const usage = await getStorageUsage();
    
    console.log(
      `[uploadResumeStorage] Initialization complete:`,
      {
        cleaned,
        migrated: migrationResult.migrated,
        currentRecords: usage.count,
        storageUsed: `${usage.estimatedKB}KB`,
      }
    );
    
    return {
      cleaned,
      migrated: migrationResult.migrated,
      usage,
    };
  } catch (e) {
    console.error(`[uploadResumeStorage] Initialization failed:`, e);
  }
}
