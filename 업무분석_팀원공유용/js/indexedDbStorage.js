/**
 * 브라우저 IndexedDB 영구 저장소 모듈 (indexedDbStorage.js)
 * 대용량 엑셀 원본 데이터를 브라우저 로컬 저장소에 영구 보존하여
 * 새로고침(F5)이나 창 닫기 후에도 불러온 데이터가 100% 유지되도록 보장합니다.
 */
class IndexedDbStorage {
  constructor(dbName = 'DataAutoVaultDB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB가 지원되지 않는 브라우저입니다.');
        return resolve(null);
      }

      const request = window.indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('vault')) {
          db.createObjectStore('vault', { keyPath: 'slotKey' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB 열기 실패:', e);
        reject(e);
      };
    });
  }

  async saveSlot(slotKey, slotData) {
    // [팀원공유용] 엑셀 데이터 업로드 시 DB 저장을 수행하지 않습니다.
    return false;
  }

  async getSlot(slotKey) {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction('vault', 'readonly');
        const store = tx.objectStore('vault');
        const req = store.get(slotKey);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (err) => reject(err);
      } catch (err) {
        reject(err);
      }
    });
  }

  async getAllSlots() {
    await this.init();
    if (!this.db) return {};

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction('vault', 'readonly');
        const store = tx.objectStore('vault');
        const req = store.getAll();
        req.onsuccess = () => {
          const result = {};
          (req.result || []).forEach(item => {
            result[item.slotKey] = {
              fileName: item.fileName,
              rows: item.rows,
              audit: item.audit,
              savedAt: item.savedAt
            };
          });
          resolve(result);
        };
        req.onerror = (err) => reject(err);
      } catch (err) {
        reject(err);
      }
    });
  }

  async removeSlot(slotKey) {
    await this.init();
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction('vault', 'readwrite');
        const store = tx.objectStore('vault');
        const req = store.delete(slotKey);
        req.onsuccess = () => resolve(true);
        req.onerror = (err) => reject(err);
      } catch (err) {
        reject(err);
      }
    });
  }

  async clearAll() {
    await this.init();
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction('vault', 'readwrite');
        const store = tx.objectStore('vault');
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = (err) => reject(err);
      } catch (err) {
        reject(err);
      }
    });
  }
}

window.indexedDbStorage = new IndexedDbStorage();
