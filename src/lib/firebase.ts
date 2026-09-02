import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { MenuItem, MicrositeProfile, ClickLog } from '../types';
import { INITIAL_MENUS, INITIAL_PROFILE } from '../data/initialData';

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
    const now = new Date().toISOString();
    
    const cleanMenus = sanitizeForFirestore(menus);
    const cleanProfile = sanitizeForFirestore(profile);

    const payload: LivePortalData = {
      menus: cleanMenus,
      profile: cleanProfile,
      lastPublishedAt: now,
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, payload);
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
