/**
 * 중앙 상태 관리소 (store.js)
 * 브라우저 메모리 및 IndexedDB 영구 저장소에 원본 데이터와 분석 상태를 안전하게 보관합니다.
 */
class AnalyticsStore {
  constructor() {
    this.state = {
      vault: {
        prevOrders: null,   // { fileName, rows, audit, savedAt }
        currOrders: null,   // { fileName, rows, audit, savedAt }
        products: null,     // { fileName, rows, audit, savedAt }
        receptions: null,   // { fileName, rows, audit, savedAt }
        errors: null       // { fileName, rows, audit, savedAt }
      },
      currentAnalysis: null, // 'all' | 'raw_...' | 'orderTrend' | 'topFlorists' | 'productProgress' | 'receptionCount' | 'errorAnalysis' | 'staffSummary'
      analysisResults: {},
      lastViewedSlot: null,  // 최근 조회한 원본 데이터 슬롯
      theme: localStorage.getItem('theme') || 'dark'
    };
    this.listeners = [];

    // 탭/페이지 간 실시간 동기화 채널 (메인 대시보드 ↔ 피드백 노트)
    try {
      this.syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cmwork_sync_channel') : null;
    } catch (e) {
      this.syncChannel = null;
    }
  }

  /**
   * 탭/창 간 실시간 동기화 이벤트 발송 (새로고침 및 데이터 변경 즉시 연동)
   */
  notifySyncEvent(type, payload = {}) {
    const eventData = {
      type,
      timestamp: Date.now(),
      ...payload
    };
    try {
      localStorage.setItem('cmwork_sync_event', JSON.stringify(eventData));
    } catch (e) {}

    if (this.syncChannel) {
      try {
        this.syncChannel.postMessage(eventData);
      } catch (e) {}
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(eventType, payload) {
    this.listeners.forEach(l => l(eventType, payload, this.state));
  }

  /**
   * 슬롯 데이터 설정 및 IndexedDB 자동 보존 (새로고침 버튼 클릭 전까지 브라우저에 유지)
   */
  async setVaultData(slot, data) {
    this.state.vault[slot] = data;
    this.state.lastViewedSlot = slot;
    this.notify('VAULT_UPDATED', { slot, data });

    // 1. IndexedDB에 영구 보존 (용량 제한 없이 새로고침 및 탭 이동 후에도 100% 유지)
    if (window.indexedDbStorage) {
      try {
        if (data && data.rows && data.rows.length > 0) {
          await window.indexedDbStorage.saveSlot(slot, data);
        } else {
          await window.indexedDbStorage.removeSlot(slot);
        }
      } catch (e) {
        console.warn('IndexedDB 슬롯 저장 오류:', e);
      }
    }

    // 2. 보조 세션 스토리지 연동
    try {
      if (data && data.rows && data.rows.length > 0) {
        sessionStorage.setItem('cmwork_slot_' + slot, JSON.stringify(data.rows));
      } else {
        sessionStorage.removeItem('cmwork_slot_' + slot);
      }
    } catch (e) {
      // 대용량 데이터 시 세션스토리지 용량 초과 무시 (IndexedDB가 완벽 담당)
    }

    // 다른 탭(피드백 노트 등)에 데이터 변경 동기화 이벤트 발송
    this.notifySyncEvent('DATA_CHANGED', { slot });
  }

  getVaultData(slot) {
    return this.state.vault[slot];
  }

  hasRequiredOrderData() {
    return !!(this.state.vault.prevOrders && this.state.vault.currOrders);
  }

  setAnalysisResult(key, result) {
    this.state.analysisResults[key] = result;
    this.state.currentAnalysis = key;
    this.notify('ANALYSIS_COMPLETED', { key, result });
  }

  /**
   * 저장된 원본 데이터 및 분석 상태 복원 (새로고침 버튼을 누르기 전까지 데이터 유지)
   */
  async loadSavedState() {
    if (window.indexedDbStorage) {
      try {
        const savedSlots = await window.indexedDbStorage.getAllSlots();
        let loadedCount = 0;
        for (const [slotKey, slotData] of Object.entries(savedSlots)) {
          if (slotData && slotData.rows && slotData.rows.length > 0) {
            this.state.vault[slotKey] = slotData;
            loadedCount++;
          }
        }
        return loadedCount > 0;
      } catch (err) {
        console.warn('저장된 IndexedDB 데이터 로드 오류:', err);
      }
    }
    return false;
  }

  /**
   * 새로고침 버튼 클릭 시: 분석 결과 및 모든 원본 데이터를 완전히 리셋(초기화)
   */
  async clearAllData() {
    if (window.indexedDbStorage) {
      try {
        await window.indexedDbStorage.clearAll();
      } catch (e) {
        console.warn('IndexedDB 초기화 오류:', e);
      }
    }
    ['prevOrders', 'currOrders', 'products', 'receptions', 'errors'].forEach(slot => {
      this.state.vault[slot] = null;
      try { sessionStorage.removeItem('cmwork_slot_' + slot); } catch(e){}
    });
    this.state.analysisResults = {};
    this.state.currentAnalysis = null;
    this.state.lastViewedSlot = null;
    try { localStorage.removeItem('cmwork_last_analysis_mode'); } catch(e){}

    // 다른 탭(피드백 노트 등)에 전체 초기화 및 새로고침 이벤트 발송
    this.notifySyncEvent('RESET_ALL');
  }
}

window.appStore = new AnalyticsStore();
