import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
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
import { MenuItem, MicrositeProfile, ClickLog } from '../types';
import { INITIAL_MENUS, INITIAL_PROFILE, INITIAL_CLICK_LOGS } from '../data/initialData';

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

export interface LivePortalData {
  menus: MenuItem[];
  profile: MicrositeProfile;
  lastPublishedAt?: string;
  updatedAt?: any;
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
 * This guarantees ANY employee on ANY device will instantly receive live updates.
 */
export function subscribeToLivePortal(
  onUpdate: (data: LivePortalData) => void,
  onError?: (error: any) => void
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
      }
    },
    (err) => {
      console.warn('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Publish updated menus and profile to Cloud Firestore so all devices sync instantly.
 */
export async function publishLivePortalToCloud(
  menus: MenuItem[],
  profile: MicrositeProfile
): Promise<{ success: boolean; timestamp: string; error?: string }> {
  try {
    const docRef = doc(db, 'portal', LIVE_PORTAL_DOC);
    const draftRef = doc(db, 'settings', DRAFT_DOC);
    const now = new Date().toISOString();
    
    const cleanMenus = sanitizeForFirestore(menus);
    const cleanProfile = sanitizeForFirestore(profile);

    const payload: LivePortalData = {
      menus: cleanMenus,
      profile: cleanProfile,
      lastPublishedAt: now,
      updatedAt: serverTimestamp(),
    };

    // Save to live portal doc and also sync draft doc
    await Promise.all([
      setDoc(docRef, payload),
      setDoc(draftRef, {
        menus: cleanMenus,
        profile: cleanProfile,
        updatedAt: serverTimestamp(),
      })
    ]);

    return { success: true, timestamp: now };
  } catch (err: any) {
    console.error('Failed to write portal to Cloud Firestore:', err);
    return { 
      success: false,
      timestamp: new Date().toISOString(), 
      error: err?.message || 'Gagal menyimpan ke server database cloud' 
    };
  }
}

/**
 * Subscribe to Admin Security (PIN) in Cloud Firestore
 * Ensures that PIN changed on one device will automatically apply to all browsers/devices.
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
      console.warn('Firestore security subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save new Admin PIN to Cloud Firestore
 */
export async function saveAdminPinToCloud(newPin: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', SECURITY_DOC);
    await setDoc(docRef, {
      pin: newPin.trim(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error('Failed to save Admin PIN to Cloud Firestore:', err);
    return false;
  }
}

/**
 * Subscribe to Admin Draft in Cloud Firestore so any admin edits are synced across devices
 */
export function subscribeToAdminDraft(
  onDraftUpdate: (data: { menus: MenuItem[]; profile: MicrositeProfile }) => void,
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
          });
        }
      }
    },
    (err) => {
      console.warn('Firestore draft subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Save draft edits to Cloud Firestore
 */
export async function saveAdminDraftToCloud(
  menus: MenuItem[],
  profile: MicrositeProfile
): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', DRAFT_DOC);
    const cleanMenus = sanitizeForFirestore(menus);
    const cleanProfile = sanitizeForFirestore(profile);
    await setDoc(docRef, {
      menus: cleanMenus,
      profile: cleanProfile,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn('Failed to save draft to cloud:', e);
    return false;
  }
}

/**
 * Log analytics click event to Cloud Firestore
 */
export async function logClickToCloud(log: ClickLog): Promise<void> {
  try {
    const logsCol = collection(db, 'click_logs');
    const cleanLog = sanitizeForFirestore(log);
    await addDoc(logsCol, {
      ...cleanLog,
      serverTime: serverTimestamp()
    });
  } catch (e) {
    console.warn('Failed to log click to cloud:', e);
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
    const logsCol = collection(db, 'click_logs');
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
        console.warn('Firestore click_logs subscription error:', err);
        if (onError) onError(err);
      }
    );
  } catch (e) {
    console.warn('Failed to setup click_logs query:', e);
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
    console.warn('Failed to fetch portal doc:', e);
  }
  return null;
}
