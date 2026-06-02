// Safe Client-side Firebase Script Loader to avoid local npm installations (disk-space safety)

const firebaseConfig = {
  apiKey: "AIzaSyBl9HQHe8VEaUBJ5EGxxQjDVK4czo3nYAQ",
  authDomain: "auravia-fe122.firebaseapp.com",
  projectId: "auravia-fe122",
  storageBucket: "auravia-fe122.firebasestorage.app",
  messagingSenderId: "292295425076",
  appId: "1:292295425076:web:34aed3a1604970470d9e61",
  measurementId: "G-QJG6KRW77Y"
};

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

export interface FirebaseServices {
  auth: any;
  db: any;
  firebase: any;
}

let firebaseInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let initPromise: Promise<FirebaseServices> | null = null;

export function initFirebaseClient(): Promise<FirebaseServices> {
  if (initPromise) return initPromise;

  initPromise = new Promise(async (resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error("Firebase can only be initialized on the client side."));
      return;
    }

    try {
      // 1. Load Firebase App compat script
      await loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
      
      // 2. Load Auth and Firestore compat scripts
      await Promise.all([
        loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"),
        loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js")
      ]);

      const w = window as any;
      if (!w.firebase) {
        throw new Error("Firebase SDK was not loaded onto window object.");
      }

      firebaseInstance = w.firebase;
      if (!firebaseInstance.apps.length) {
        firebaseInstance.initializeApp(firebaseConfig);
      }

      authInstance = firebaseInstance.auth();
      dbInstance = firebaseInstance.firestore();

      console.log("Firebase initialized successfully via browser CDN scripts.");
      resolve({
        auth: authInstance,
        db: dbInstance,
        firebase: firebaseInstance
      });
    } catch (err) {
      console.error("Firebase CDN dynamic initialization failed:", err);
      reject(err);
    }
  });

  return initPromise;
}

// Mock offline fallback instances so the app never crashes
export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: (cb: (user: any) => void) => {
    if (typeof window === 'undefined') return () => {};
    // Check localStorage for a guest user
    const guestUser = localStorage.getItem('gobro_guest_user');
    if (guestUser) {
      cb(JSON.parse(guestUser));
    } else {
      cb(null);
    }
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string) => {
    const user = { uid: `mock-${email.replace(/[^a-z0-9]/g, '')}`, email, isMock: true };
    localStorage.setItem('gobro_guest_user', JSON.stringify(user));
    return { user };
  },
  createUserWithEmailAndPassword: async (email: string) => {
    const user = { uid: `mock-${email.replace(/[^a-z0-9]/g, '')}`, email, isMock: true };
    localStorage.setItem('gobro_guest_user', JSON.stringify(user));
    return { user };
  },
  signInWithPopup: async (provider?: any) => {
    const user = { uid: 'mock-google-user-101', email: 'google.explorer@gobro.ai', isMock: true };
    localStorage.setItem('gobro_guest_user', JSON.stringify(user));
    return { user };
  },
  signOut: async () => {
    localStorage.removeItem('gobro_guest_user');
  }
};

export const mockDb = {
  collection: (colName: string) => {
    return {
      doc: (docId: string) => {
        return {
          get: async () => {
            const data = localStorage.getItem(`gobro_db_${colName}_${docId}`);
            return {
              exists: !!data,
              data: () => data ? JSON.parse(data) : null
            };
          },
          set: async (val: any, options?: any) => {
            let data = val;
            if (options?.merge) {
              const current = localStorage.getItem(`gobro_db_${colName}_${docId}`);
              if (current) {
                data = { ...JSON.parse(current), ...val };
              }
            }
            localStorage.setItem(`gobro_db_${colName}_${docId}`, JSON.stringify(data));
          }
        };
      }
    };
  }
};
