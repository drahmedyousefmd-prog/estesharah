/**
 * Firebase config for the shared Firestore database between the two sites:
 *   - This patient site (ESTESHARAH) writes tickets + chat messages.
 *   - The doctor site (ROCHETTA /doctor/inbox) reads them in real time.
 *
 * HOW TO ENABLE (takes ~10 min, one-time):
 * 1. Create a Firebase project at https://console.firebase.google.com (free Spark plan).
 * 2. In Build → Firestore Database → Create database (production mode is fine).
 * 3. In Project settings → General → "Your apps" → Add app → Web (</>).
 *    Copy apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId.
 * 4. Paste them below in FIREBASE_CONFIG.
 * 5. Deploy the security rules (see FIREBASE_SETUP.md + firestore.rules).
 *
 * Until you fill FIREBASE_CONFIG, the site keeps working with browser
 * localStorage only (current demo behavior) and never downloads the SDK.
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/** null = Firebase disabled → localStorage-only. Fill the fields to enable. */
export const FIREBASE_CONFIG: FirebaseConfig | null = null;

export function isFirebaseConfigured(): boolean {
  return FIREBASE_CONFIG !== null;
}