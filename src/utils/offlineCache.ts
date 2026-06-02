// GOBRO local database manager (IndexedDB offline cache wrapper)

const DB_NAME = 'gobro_db';
const DB_VERSION = 1;

export interface OfflineItinerary {
  id: string;
  destination: string;
  days: number;
  diet: string;
  pace: string;
  compiledAt: string;
  cost: number;
}

export interface OfflinePolaroid {
  id: string;
  note: string;
  imageUrl: string;
  timestamp: string;
}

class GOBRODatabase {
  private db: IDBDatabase | null = null;

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create store for itineraries
        if (!db.objectStoreNames.contains('itineraries')) {
          db.createObjectStore('itineraries', { keyPath: 'id' });
        }
        
        // Create store for polaroid memories
        if (!db.objectStoreNames.contains('polaroids')) {
          db.createObjectStore('polaroids', { keyPath: 'id' });
        }
        
        // Create store for chat logs
        if (!db.objectStoreNames.contains('chat_logs')) {
          db.createObjectStore('chat_logs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => {
        reject(event.target.error);
      };
    });
  }

  // Generic Save operation
  private save(storeName: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        // Fallback to localStorage if IndexedDB is not fully initialized
        try {
          const key = `${storeName}_${item.id}`;
          localStorage.setItem(key, JSON.stringify(item));
          resolve();
        } catch (e) {
          reject(e);
        }
        return;
      }

      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Generic Fetch All operation
  private getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        // Fallback to localStorage
        try {
          const items: any[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${storeName}_`)) {
              items.push(JSON.parse(localStorage.getItem(key) || '{}'));
            }
          }
          resolve(items);
        } catch (e) {
          reject(e);
        }
        return;
      }

      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Itinerary Store Bindings
  async saveItinerary(itinerary: OfflineItinerary): Promise<void> {
    await this.save('itineraries', itinerary);
  }

  async getItineraries(): Promise<OfflineItinerary[]> {
    return await this.getAll('itineraries');
  }

  // Polaroid Store Bindings
  async savePolaroid(polaroid: OfflinePolaroid): Promise<void> {
    await this.save('polaroids', polaroid);
  }

  async getPolaroids(): Promise<OfflinePolaroid[]> {
    return await this.getAll('polaroids');
  }

  async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        try {
          localStorage.clear();
          resolve();
        } catch (e) {
          reject(e);
        }
        return;
      }
      
      const tx = this.db.transaction(['itineraries', 'polaroids', 'chat_logs'], 'readwrite');
      tx.objectStore('itineraries').clear();
      tx.objectStore('polaroids').clear();
      tx.objectStore('chat_logs').clear();
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDB = new GOBRODatabase();

// Initialize local DB on import (safe for Next.js SSR)
if (typeof window !== 'undefined') {
  localDB.init().catch(console.error);
}
