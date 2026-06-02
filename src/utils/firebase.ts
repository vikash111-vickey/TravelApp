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
  storage: any;
  firebase: any;
}

let firebaseInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;
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
      
      // 2. Load Auth, Firestore, and Storage compat scripts
      await Promise.all([
        loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"),
        loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"),
        loadScript("https://www.gstatic.com/firebasejs/10.8.0/firebase-storage-compat.js")
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
      
      // Enable Firestore offline persistence for offline-first capabilities
      if (typeof window !== 'undefined') {
        dbInstance.enablePersistence({ synchronizeTabs: true }).catch((err: any) => {
          if (err.code === 'failed-precondition') {
            console.warn("Firestore persistence failed-precondition (multiple tabs open)");
          } else if (err.code === 'unimplemented') {
            console.warn("Firestore persistence unimplemented in this browser");
          }
        });
      }

      try {
        storageInstance = firebaseInstance.storage();
      } catch (err) {
        console.warn("Storage compat failed to init, using mock fallback:", err);
        storageInstance = mockStorage;
      }

      console.log("Firebase initialized successfully via browser CDN scripts.");
      resolve({
        auth: authInstance,
        db: dbInstance,
        storage: storageInstance,
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
export const mockStorage = {
  ref: () => {
    return {
      child: (path: string) => {
        return {
          put: async (file: any) => {
            console.log(`[Mock Storage] Uploading file to path: ${path}`);
            return { state: 'success' };
          },
          getDownloadURL: async () => {
            console.log(`[Mock Storage] Generating download URL for path: ${path}`);
            // Return placeholder or random avatar
            return `https://api.dicebear.com/7.x/adventurer/svg?seed=uploaded-${Math.random().toString(36).substring(7)}`;
          }
        };
      }
    };
  }
};

const attachMockUserMethods = (user: any) => {
  if (!user) return user;
  user.updateProfile = async function(profile: { displayName?: string; photoURL?: string }) {
    if (profile.displayName !== undefined) this.displayName = profile.displayName;
    if (profile.photoURL !== undefined) this.photoURL = profile.photoURL;
    localStorage.setItem('gobro_guest_user', JSON.stringify(this));
    mockAuth.currentUser = this;
  };
  return user;
};

export const mockAuth = {
  currentUser: null as any,
  onAuthStateChanged: (cb: (user: any) => void) => {
    if (typeof window === 'undefined') return () => {};
    // Check localStorage for a guest user
    const guestUser = localStorage.getItem('gobro_guest_user');
    if (guestUser) {
      const u = attachMockUserMethods(JSON.parse(guestUser));
      mockAuth.currentUser = u;
      cb(u);
    } else {
      mockAuth.currentUser = null;
      cb(null);
    }
    return () => {};
  },
  signInWithEmailAndPassword: async (email: string) => {
    const user = attachMockUserMethods({ 
      uid: `mock-${email.replace(/[^a-z0-9]/g, '')}`, 
      email, 
      displayName: '', 
      photoURL: '', 
      isMock: true 
    });
    localStorage.setItem('gobro_guest_user', JSON.stringify(user));
    mockAuth.currentUser = user;
    return { user };
  },
  createUserWithEmailAndPassword: async (email: string) => {
    const user = attachMockUserMethods({ 
      uid: `mock-${email.replace(/[^a-z0-9]/g, '')}`, 
      email, 
      displayName: '', 
      photoURL: '', 
      isMock: true 
    });
    localStorage.setItem('gobro_guest_user', JSON.stringify(user));
    mockAuth.currentUser = user;
    return { user };
  },
  signInWithPopup: async (provider?: any) => {
    let email = '';
    if (typeof window !== 'undefined') {
      const input = prompt("Enter your Gmail address to simulate Google Sign-In:", "explorer@gmail.com");
      if (input === null) {
        throw new Error("Google Sign-In was cancelled.");
      }
      email = input.trim() || 'google.explorer@gobro.ai';
    } else {
      email = 'google.explorer@gobro.ai';
    }
    const prefix = email.split('@')[0];
    const displayName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    const user = attachMockUserMethods({ 
      uid: `mock-google-${email.replace(/[^a-z0-9]/g, '')}`, 
      email, 
      displayName,
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${prefix}`,
      isMock: true 
    });
    localStorage.setItem('gobro_guest_user', JSON.stringify(user));
    mockAuth.currentUser = user;
    return { user };
  },
  signOut: async () => {
    localStorage.removeItem('gobro_guest_user');
    mockAuth.currentUser = null;
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
