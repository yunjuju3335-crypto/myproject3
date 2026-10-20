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
        errors: null,       // { fileName, rows, audit, savedAt }
        performances: null  // { fileName, rows, audit, savedAt }
      },
      currentAnalysis: null, // 'all' | 'raw_...' | 'orderTrend' | 'topFlorists' | 'productProgress' | 'receptionCount' | 'errorAnalysis' | 'staffSummary'
      analysisResults: {},
      lastViewedSlot: null,  // 최근 조회한 원본 데이터 슬롯
      theme: localStorage.getItem('theme') || 'dark'
    };
    this.listeners = [];
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
   * 슬롯 데이터 설정 (팀원공유용: 외부 DB / IndexedDB 영구 저장을 하지 않고 현재 세션 메모리에만 유지)
   */
  async setVaultData(slot, data) {
    this.state.vault[slot] = data;
    this.state.lastViewedSlot = slot;
    this.notify('VAULT_UPDATED', { slot, data });
    // [팀원공유용 보안 정책] 업로드한 엑셀 데이터는 DB(Supabase / IndexedDB 등)에 저장하지 않습니다.
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
   * 브라우저 초기화 시 기존 잔여 DB 데이터 초기화 및 항상 깨끗한 초기 상태 보장
   */
  async loadSavedState() {
    if (window.indexedDbStorage && typeof window.indexedDbStorage.clearAll === 'function') {
      try {
        await window.indexedDbStorage.clearAll();
      } catch (err) {
        // 무시
      }
    }
    return false;
  }
}

window.appStore = new AnalyticsStore();
