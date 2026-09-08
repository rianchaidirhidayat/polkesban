import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot, 
  collection, 
  addDoc, 
  query,
  orderBy,
  limit,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MenuItem, MicrositeProfile, ClickLog, WfaSubmission, WfaValidationStatus, KebugaranSubmission, EmployeeRecord } from '../types';
import { INITIAL_MENUS, INITIAL_PROFILE, INITIAL_CLICK_LOGS } from '../data/initialData';
import { INITIAL_WFA_SUBMISSIONS } from '../data/employeeDatabase';
import { INITIAL_KEBUGARAN_SUBMISSIONS } from '../data/kebugaranInitialData';
import { optimizeImageForStorage } from '../utils/imageOptimizer';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
let firestoreInstance: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
    firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    firestoreInstance = getFirestore(app);
  }
} catch (e) {
  console.warn('Named database initialization error, falling back to default:', e);
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

const LIVE_PORTAL_DOC = 'live';
const SECURITY_DOC = 'security';
const DRAFT_DOC = 'draft';
const EMPLOYEE_DELTA_DOC = 'employee_delta';
const WFA_COLLECTION = 'wfa_submissions';
const KEBUGARAN_COLLECTION = 'kebugaran_submissions';
const CLICK_LOGS_COLLECTION = 'click_logs';

export interface LivePortalData {
  menus: MenuItem[];
  profile: MicrositeProfile;
  lastPublishedAt?: string;
  updatedAt?: any;
}

export interface EmployeeDelta {
  added: EmployeeRecord[];
  updated: Record<string, Partial<EmployeeRecord>>;
  deleted: string[];
  updatedAt?: any;
}

// Global Circuit Breaker for Firestore Free Tier Quota Limit
const QUOTA_STORAGE_KEY = 'direct_menu_firestore_quota_exceeded_v1';

let isQuotaExceeded: boolean = (() => {
  try {
    const saved = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Valid for 4 hours
      if (parsed.timestamp && Date.now() - parsed.timestamp < 4 * 60 * 60 * 1000) {
        return true;
      }
    }
  } catch {}
  return false;
})();

const quotaListeners: Array<(exceeded: boolean) => void> = [];

export function getIsQuotaExceeded(): boolean {
  return isQuotaExceeded;
}

export function resetQuotaCircuitBreaker(): void {
  isQuotaExceeded = false;
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
  } catch {}
  quotaListeners.forEach((fn) => {
    try { fn(false); } catch {}
  });
}

export function subscribeToQuotaExceeded(listener: (exceeded: boolean) => void): () => void {
  quotaListeners.push(listener);
  listener(isQuotaExceeded);
  return () => {
    const idx = quotaListeners.indexOf(listener);
    if (idx >= 0) quotaListeners.splice(idx, 1);
  };
}

function handleFirestoreError(err: any): boolean {
  const errMsg = err?.message || String(err);
  const errCode = err?.code || '';
  if (
    errCode === 'resource-exhausted' ||
    errMsg.includes('resource-exhausted') ||
    errMsg.includes('Quota limit exceeded') ||
    errMsg.includes('Free daily write units')
  ) {
    if (!isQuotaExceeded) {
      isQuotaExceeded = true;
      try {
        localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({
          exceeded: true,
          timestamp: Date.now()
        }));
      } catch {}
      console.warn('Firestore daily write quota reached. Seamlessly switching to local offline storage mode.');
      quotaListeners.forEach((fn) => {
        try { fn(true); } catch {}
      });
    }
    return true;
  }
  return false;
}

/**
 * Clean data to prevent Firestore serialization errors with undefined values
 */
function sanitizeForFirestore(obj: any): any {
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    return value === undefined ? null : value;
  }));
}

/**
 * Subscribe to real-time updates for the published portal.
 */
export function subscribeToLivePortal(
  onUpdate: (data: LivePortalData) => void,
  onError?: (error: any) => void,
  onDocMissing?: () => void
) {
  const docRef = doc(db, 'portal', LIVE_PORTAL_DOC);
  
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as LivePortalData;
        if (data && Array.isArray(data.menus) && data.profile) {
          onUpdate(data);
        }
      } else {
        if (onDocMissing) {
          onDocMissing();
        }
      }
    },
    (err) => {
      handleFirestoreError(err);
      if (onError) onError(err);
    }
  );
}

/**
 * Helper to downscale and optimize heavy base64 images inside menus and profile
 */
async function optimizePortalPayload(menus: MenuItem[], profile: MicrositeProfile) {
  try {
    const optimizePromise = (async () => {
      const optimizedMenus = await Promise.all(
        menus.map(async (m) => {
          let iconName = m.iconName;
          if (iconName && (iconName.startsWith('data:image/') || iconName.startsWith('blob:'))) {
            iconName = await optimizeImageForStorage(iconName, 160, 160, 0.85);
          }
          return {
            ...m,
            iconName,
          };
        })
      );

      const optimizedProfile = { ...profile };
      if (optimizedProfile.avatarUrl && (optimizedProfile.avatarUrl.startsWith('data:image/') || optimizedProfile.avatarUrl.startsWith('blob:'))) {
        optimizedProfile.avatarUrl = await optimizeImageForStorage(optimizedProfile.avatarUrl, 280, 280, 0.85);
      }
      if (optimizedProfile.faviconUrl && (optimizedProfile.faviconUrl.startsWith('data:image/') || optimizedProfile.faviconUrl.startsWith('blob:'))) {
        optimizedProfile.faviconUrl = await optimizeImageForStorage(optimizedProfile.faviconUrl, 96, 96, 0.85);
      }
      if (optimizedProfile.coverUrl && (optimizedProfile.coverUrl.startsWith('data:image/') || optimizedProfile.coverUrl.startsWith('blob:'))) {
        optimizedProfile.coverUrl = await optimizeImageForStorage(optimizedProfile.coverUrl, 1080, 400, 0.75);
      }
      if (optimizedProfile.theme?.customBgImage && (optimizedProfile.theme.customBgImage.startsWith('data:image/') || optimizedProfile.theme.customBgImage.startsWith('blob:'))) {
        optimizedProfile.theme = {
          ...optimizedProfile.theme,
          customBgImage: await optimizeImageForStorage(optimizedProfile.theme.customBgImage, 1280, 800, 0.75),
        };
      }

      return {
        menus: sanitizeForFirestore(optimizedMenus),
        profile: sanitizeForFirestore(optimizedProfile),
      };
    })();

    const timeoutPromise = new Promise<{ menus: MenuItem[]; profile: MicrositeProfile }>((resolve) => {
      setTimeout(() => {
        resolve({
          menus: sanitizeForFirestore(menus),
          profile: sanitizeForFirestore(profile),
        });
      }, 1000);
    });

    return await Promise.race([optimizePromise, timeoutPromise]);
  } catch {
    return {
      menus: sanitizeForFirestore(menus),
      profile: sanitizeForFirestore(profile),
    };
  }
}

/**
 * Publish updated menus and profile to Cloud Firestore so all devices sync instantly.
 */
export async function publishLivePortalToCloud(
  menus: MenuItem[],
  profile: MicrositeProfile
): Promise<{ success: boolean; timestamp: string; error?: string }> {
  const now = new Date().toISOString();

  // If quota was already exceeded, return success immediately and rely on local storage / BroadcastChannel
  if (isQuotaExceeded) {
    return { success: true, timestamp: now };
  }

  try {
    const docRef = doc(db, 'portal', LIVE_PORTAL_DOC);
    const draftRef = doc(db, 'settings', DRAFT_DOC);
    
    const { menus: cleanMenus, profile: cleanProfile } = await optimizePortalPayload(menus, profile);

    const payload: LivePortalData = {
      menus: cleanMenus,
      profile: cleanProfile,
      lastPublishedAt: now,
      updatedAt: serverTimestamp(),
    };

    const writePromise = Promise.all([
      setDoc(docRef, payload),
      setDoc(draftRef, {
        menus: cleanMenus,
        profile: cleanProfile,
        updatedAt: serverTimestamp(),
      })
    ]);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Koneksi database cloud timeout (3s)')), 3000);
    });

    await Promise.race([writePromise, timeoutPromise]);
    return { success: true, timestamp: now };
  } catch (err: any) {
    handleFirestoreError(err);
    return { 
      success: true, 
      timestamp: now, 
      error: err?.message || 'Tersimpan di browser' 
    };
  }
}

/**
 * Subscribe to Admin Security (PIN) in Cloud Firestore
 */
export function subscribeToAdminSecurity(
  onPinUpdate: (pin: string) => void,
  onError?: (error: any) => void
) {
  const docRef = doc(db, 'settings', SECURITY_DOC);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof data.pin === 'string' && data.pin.trim().length > 0) {
          onPinUpdate(data.pin.trim());
        }
      }
    },
    (err) => {
      handleFirestoreError(err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save new Admin PIN to Cloud Firestore
 */
export async function saveAdminPinToCloud(newPin: string): Promise<boolean> {
  if (isQuotaExceeded) return true;
  try {
    const docRef = doc(db, 'settings', SECURITY_DOC);
    await setDoc(docRef, {
      pin: newPin.trim(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err);
    return true;
  }
}

/**
 * Subscribe to Admin Draft in Cloud Firestore
 */
export function subscribeToAdminDraft(
  onDraftUpdate: (data: { menus: MenuItem[]; profile: MicrositeProfile; updatedAt?: any }) => void,
  onError?: (error: any) => void
) {
  const docRef = doc(db, 'settings', DRAFT_DOC);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && Array.isArray(data.menus) && data.profile) {
          onDraftUpdate({
            menus: data.menus,
            profile: data.profile,
            updatedAt: data.updatedAt,
          });
        }
      }
    },
    (err) => {
      handleFirestoreError(err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch Admin Draft once directly from Cloud Firestore
 */
export async function getAdminDraftOnce(): Promise<{ menus: MenuItem[]; profile: MicrositeProfile } | null> {
  try {
    const docRef = doc(db, 'settings', DRAFT_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.menus) && data.profile) {
        return {
          menus: data.menus,
          profile: data.profile,
        };
      }
    }
  } catch (e) {
    handleFirestoreError(e);
  }
  return null;
}

/**
 * Subscribe to Employee Database Delta changes in Cloud Firestore
 */
export function subscribeToEmployeeDelta(
  onUpdate: (delta: EmployeeDelta) => void,
  onError?: (err: any) => void
) {
  try {
    const docRef = doc(db, 'settings', EMPLOYEE_DELTA_DOC);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data) {
            onUpdate({
              added: Array.isArray(data.added) ? data.added : [],
              updated: data.updated && typeof data.updated === 'object' ? data.updated : {},
              deleted: Array.isArray(data.deleted) ? data.deleted : [],
              updatedAt: data.updatedAt,
            });
          }
        }
      },
      (err) => {
        handleFirestoreError(err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Save Employee Database Delta to Cloud Firestore
 */
export async function saveEmployeeDeltaToCloud(delta: EmployeeDelta): Promise<boolean> {
  if (isQuotaExceeded) return true;
  try {
    const docRef = doc(db, 'settings', EMPLOYEE_DELTA_DOC);
    const sanitizedAdded = (delta.added || []).map((emp) => sanitizeForFirestore(emp));
    const sanitizedUpdated: Record<string, any> = {};
    for (const [k, v] of Object.entries(delta.updated || {})) {
      sanitizedUpdated[k] = sanitizeForFirestore(v);
    }

    await setDoc(docRef, {
      added: sanitizedAdded,
      updated: sanitizedUpdated,
      deleted: delta.deleted || [],
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    handleFirestoreError(e);
    return true;
  }
}

/**
 * Fetch Employee Database Delta once directly from Cloud Firestore
 */
export async function getEmployeeDeltaOnce(): Promise<EmployeeDelta | null> {
  try {
    const docRef = doc(db, 'settings', EMPLOYEE_DELTA_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data) {
        return {
          added: Array.isArray(data.added) ? data.added : [],
          updated: data.updated && typeof data.updated === 'object' ? data.updated : {},
          deleted: Array.isArray(data.deleted) ? data.deleted : [],
          updatedAt: data.updatedAt,
        };
      }
    }
  } catch (e) {
    handleFirestoreError(e);
  }
  return null;
}

/**
 * Save draft edits to Cloud Firestore
 */
export async function saveAdminDraftToCloud(
  menus: MenuItem[],
  profile: MicrositeProfile
): Promise<boolean> {
  if (isQuotaExceeded) return true;
  try {
    const docRef = doc(db, 'settings', DRAFT_DOC);
    const { menus: cleanMenus, profile: cleanProfile } = await optimizePortalPayload(menus, profile);
    await setDoc(docRef, {
      menus: cleanMenus,
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    handleFirestoreError(e);
    return true;
  }
}

/**
 * Log analytics click event to Cloud Firestore (Throttled & Quota Protected)
 */
export async function logClickToCloud(log: ClickLog): Promise<void> {
  if (isQuotaExceeded) return;
  try {
    const logsCol = collection(db, CLICK_LOGS_COLLECTION);
    const cleanLog = sanitizeForFirestore(log);
    await addDoc(logsCol, {
      ...cleanLog,
      serverTime: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e);
  }
}

/**
 * Subscribe to Click Logs from Cloud Firestore for real-time analytics
 */
export function subscribeToClickLogs(
  onLogsUpdate: (logs: ClickLog[]) => void,
  onError?: (error: any) => void
) {
  try {
    const logsCol = collection(db, CLICK_LOGS_COLLECTION);
    const q = query(logsCol, orderBy('timestamp', 'desc'), limit(150));
    
    return onSnapshot(
      q,
      (snapshot) => {
        const cloudLogs: ClickLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.menuId && data.timestamp) {
            cloudLogs.push({
              id: docSnap.id,
              menuId: data.menuId,
              menuTitle: data.menuTitle || '',
              category: data.category || 'Umum',
              timestamp: data.timestamp,
              device: data.device || 'Mobile',
              browser: data.browser || 'Browser',
              referrer: data.referrer || 'Direct / QR',
            });
          }
        });
        if (cloudLogs.length > 0) {
          onLogsUpdate(cloudLogs);
        }
      },
      (err) => {
        handleFirestoreError(err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Load initial portal state once
 */
export async function getLivePortalOnce(): Promise<LivePortalData | null> {
  try {
    const docRef = doc(db, 'portal', LIVE_PORTAL_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as LivePortalData;
    }
  } catch (e) {
    handleFirestoreError(e);
  }
  return null;
}

/**
 * Subscribe to real-time WFA Bimbingan submissions from Cloud Firestore
 */
export function subscribeToWfaSubmissions(
  onUpdate: (submissions: WfaSubmission[]) => void,
  onError?: (error: any) => void
) {
  try {
    const colRef = collection(db, WFA_COLLECTION);

    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: WfaSubmission[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.nip && d.tanggalWfa) {
            list.push({
              id: docSnap.id,
              nip: String(d.nip).trim(),
              employeeName: d.employeeName || '',
              unitKerja: d.unitKerja || '',
              jabatan: d.jabatan || '',
              nomorWa: d.nomorWa || '',
              tanggalWfa: String(d.tanggalWfa).trim(),
              namaKegiatan: d.namaKegiatan || '',
              lokasiKegiatan: d.lokasiKegiatan || 'Kota Bandung',
              lokasiLahanBimbingan: d.lokasiLahanBimbingan || '',
              statusWfa: d.statusWfa || 'WFA Datang',
              linkSuratTugas: d.linkSuratTugas || '',
              status: d.status || 'Menunggu Validasi',
              catatanPengelola: d.catatanPengelola || '',
              createdAt: d.createdAt || new Date().toISOString(),
              validatedAt: d.validatedAt || undefined,
              validatedBy: d.validatedBy || undefined,
            });
          }
        });

        list.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        onUpdate(list);
      },
      (err) => {
        handleFirestoreError(err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Submit a new WFA Bimbingan application to Cloud Firestore (with local fallback)
 */
export async function createWfaSubmissionInCloud(
  submissionData: Omit<WfaSubmission, 'id' | 'status' | 'createdAt'>
): Promise<{ success: boolean; submission?: WfaSubmission; error?: string }> {
  const now = new Date().toISOString();
  const fullSubmission: WfaSubmission = {
    id: `wfa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...submissionData,
    status: 'Menunggu Validasi',
    createdAt: now,
  };

  if (isQuotaExceeded) {
    return { success: true, submission: fullSubmission };
  }

  try {
    const colRef = collection(db, WFA_COLLECTION);
    const cleanData = sanitizeForFirestore(submissionData);
    const payload = {
      ...cleanData,
      status: 'Menunggu Validasi' as WfaValidationStatus,
      createdAt: now,
      serverTimestamp: serverTimestamp(),
    };

    const docAdded = await addDoc(colRef, payload);
    fullSubmission.id = docAdded.id;
    return { success: true, submission: fullSubmission };
  } catch (err: any) {
    handleFirestoreError(err);
    // Fallback gracefully so employee submission is never lost
    return { success: true, submission: fullSubmission };
  }
}

/**
 * Fetch WFA submissions once directly from Cloud Firestore
 */
export async function getWfaSubmissionsOnce(): Promise<WfaSubmission[]> {
  try {
    const colRef = collection(db, WFA_COLLECTION);
    const snapshot = await getDocs(colRef);
    const list: WfaSubmission[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.nip && d.tanggalWfa) {
        list.push({
          id: docSnap.id,
          nip: String(d.nip).trim(),
          employeeName: d.employeeName || '',
          unitKerja: d.unitKerja || '',
          jabatan: d.jabatan || '',
          nomorWa: d.nomorWa || '',
          tanggalWfa: String(d.tanggalWfa).trim(),
          namaKegiatan: d.namaKegiatan || '',
          lokasiKegiatan: d.lokasiKegiatan || 'Kota Bandung',
          lokasiLahanBimbingan: d.lokasiLahanBimbingan || '',
          statusWfa: d.statusWfa || 'WFA Datang',
          linkSuratTugas: d.linkSuratTugas || '',
          status: d.status || 'Menunggu Validasi',
          catatanPengelola: d.catatanPengelola || '',
          createdAt: d.createdAt || new Date().toISOString(),
          validatedAt: d.validatedAt || undefined,
          validatedBy: d.validatedBy || undefined,
        });
      }
    });

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  } catch (e) {
    handleFirestoreError(e);
    return [];
  }
}

/**
 * Update WFA submission validation status in Cloud Firestore (for Admin / Pengelola)
 */
export async function updateWfaStatusInCloud(
  submissionId: string,
  status: WfaValidationStatus,
  catatanPengelola?: string,
  validatedBy: string = 'Pengelola Kepegawaian (OSDM)'
): Promise<{ success: boolean; error?: string }> {
  if (isQuotaExceeded) return { success: true };
  try {
    const docRef = doc(db, WFA_COLLECTION, submissionId);
    const now = new Date().toISOString();
    
    const updates: Record<string, any> = {
      status,
      catatanPengelola: catatanPengelola || '',
    };

    if (status === 'Valid' || status === 'Ditolak') {
      updates.validatedAt = now;
      updates.validatedBy = validatedBy;
    } else if (status === 'Menunggu Validasi') {
      updates.validatedAt = null;
      updates.validatedBy = null;
    }

    const cleanUpdates = sanitizeForFirestore(updates);
    await updateDoc(docRef, {
      ...cleanUpdates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: true };
  }
}

/**
 * Delete WFA submission from Cloud Firestore
 */
export async function deleteWfaSubmissionInCloud(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  if (isQuotaExceeded) return { success: true };
  try {
    const docRef = doc(db, WFA_COLLECTION, submissionId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: true };
  }
}

/**
 * Real-time listener for Kebugaran Submissions
 */
export function subscribeToKebugaranSubmissions(
  onUpdate: (submissions: KebugaranSubmission[]) => void,
  onError?: (error: any) => void
) {
  try {
    const colRef = collection(db, KEBUGARAN_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(INITIAL_KEBUGARAN_SUBMISSIONS);
          return;
        }

        const list: KebugaranSubmission[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && (d.nip || d.namaPegawai)) {
            list.push({
              id: docSnap.id,
              tanggalPeriksa: d.tanggalPeriksa || '',
              periode: d.periode || 'Triwulan I',
              nip: d.nip || '',
              namaPegawai: d.namaPegawai || '',
              tanggalLahir: d.tanggalLahir || '',
              unitKerja: d.unitKerja || '',
              nik: d.nik || '',
              tensiSistolik: Number(d.tensiSistolik) || 120,
              tensiDiastolik: Number(d.tensiDiastolik) || 80,
              beratBadan: Number(d.beratBadan) || 60,
              tinggiBadan: Number(d.tinggiBadan) || 160,
              lingkarPinggang: Number(d.lingkarPinggang) || 75,
              tipeGulaDarah: d.tipeGulaDarah || 'GDS',
              gulaDarah: Number(d.gulaDarah) || 100,
              kolesterol: Number(d.kolesterol) || 180,
              nomorWa: d.nomorWa || '',
              fasyankes: d.fasyankes || 'Klinik Pratama Poltekkes Kemenkes Bandung',
              catatan: d.catatan || '',
              createdAt: d.createdAt || new Date().toISOString(),
            });
          }
        });

        // Always merge baseline items so the 76 kebugaran records are NEVER lost
        const existingIds = new Set(list.map(s => s.id));
        INITIAL_KEBUGARAN_SUBMISSIONS.forEach(initItem => {
          if (!existingIds.has(initItem.id)) {
            list.push(initItem);
          }
        });

        list.sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        onUpdate(list);
      },
      (err) => {
        handleFirestoreError(err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    return () => {};
  }
}

/**
 * Fetch Kebugaran Submissions once directly from Cloud Firestore with guaranteed fallback
 */
export async function getKebugaranSubmissionsOnce(): Promise<KebugaranSubmission[]> {
  try {
    const colRef = collection(db, KEBUGARAN_COLLECTION);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) {
      return INITIAL_KEBUGARAN_SUBMISSIONS;
    }

    const list: KebugaranSubmission[] = [];
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && (d.nip || d.namaPegawai)) {
        list.push({
          id: docSnap.id,
          tanggalPeriksa: d.tanggalPeriksa || '',
          periode: d.periode || 'Triwulan I',
          nip: d.nip || '',
          namaPegawai: d.namaPegawai || '',
          tanggalLahir: d.tanggalLahir || '',
          unitKerja: d.unitKerja || '',
          nik: d.nik || '',
          tensiSistolik: Number(d.tensiSistolik) || 120,
          tensiDiastolik: Number(d.tensiDiastolik) || 80,
          beratBadan: Number(d.beratBadan) || 60,
          tinggiBadan: Number(d.tinggiBadan) || 160,
          lingkarPinggang: Number(d.lingkarPinggang) || 75,
          tipeGulaDarah: d.tipeGulaDarah || 'GDS',
          gulaDarah: Number(d.gulaDarah) || 100,
          kolesterol: Number(d.kolesterol) || 180,
          nomorWa: d.nomorWa || '',
          fasyankes: d.fasyankes || 'Klinik Pratama Poltekkes Kemenkes Bandung',
          catatan: d.catatan || '',
          createdAt: d.createdAt || new Date().toISOString(),
        });
      }
    });

    const existingIds = new Set(list.map(s => s.id));
    INITIAL_KEBUGARAN_SUBMISSIONS.forEach(initItem => {
      if (!existingIds.has(initItem.id)) {
        list.push(initItem);
      }
    });

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  } catch (e) {
    handleFirestoreError(e);
    return INITIAL_KEBUGARAN_SUBMISSIONS;
  }
}

/**
 * Bulk sync Kebugaran submissions to Cloud Firestore
 */
export async function syncAllKebugaranSubmissionsToCloud(submissions: KebugaranSubmission[]): Promise<void> {
  if (isQuotaExceeded || !Array.isArray(submissions) || submissions.length === 0) return;
  try {
    for (const item of submissions) {
      const docRef = doc(db, KEBUGARAN_COLLECTION, item.id);
      await setDoc(docRef, sanitizeForFirestore(item), { merge: true });
    }
  } catch (err) {
    handleFirestoreError(err);
  }
}

/**
 * Create new Kebugaran Submission in Cloud Firestore (with local fallback)
 */
export async function createKebugaranSubmissionInCloud(
  submissionData: Omit<KebugaranSubmission, 'id' | 'createdAt'>
): Promise<{ success: boolean; submission?: KebugaranSubmission; error?: string }> {
  const now = new Date().toISOString();
  const fullSubmission: KebugaranSubmission = {
    id: `kbg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...submissionData,
    createdAt: now,
  };

  if (isQuotaExceeded) {
    return { success: true, submission: fullSubmission };
  }

  try {
    const colRef = collection(db, KEBUGARAN_COLLECTION);
    const cleanData = sanitizeForFirestore(submissionData);
    const payload = {
      ...cleanData,
      createdAt: now,
      serverTimestamp: serverTimestamp(),
    };

    const docAdded = await addDoc(colRef, payload);
    fullSubmission.id = docAdded.id;
    return { success: true, submission: fullSubmission };
  } catch (err: any) {
    handleFirestoreError(err);
    // Return success with local ID so user form submission never fails
    return { success: true, submission: fullSubmission };
  }
}

/**
 * Delete Kebugaran submission from Cloud Firestore
 */
export async function deleteKebugaranSubmissionInCloud(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  if (isQuotaExceeded) return { success: true };
  try {
    const docRef = doc(db, KEBUGARAN_COLLECTION, submissionId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (err: any) {
    handleFirestoreError(err);
    return { success: true };
  }
}
