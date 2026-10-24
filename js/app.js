/**
 * 메인 애플리케이션 컨트롤러 (app.js)
 * - 원본 데이터 불러오기 시 실물 표(Table) 즉시 표시 및 IndexedDB 자동 영구 보존
 * - 새로고침(F5) 및 브라우저 재실행 시 100% 자동 복원
 * - 1번(발주 추이), 2번(증가 화원사 1~10위), 2번(농장 완료건), 3번(접수 수량), 4번(오류 집계), 5번(개인별 집계) 전수 표 렌더링
 */

// 안전한 토스트 메시지 함수
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : '💾');
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', async () => {
  const store = window.appStore;
  const auditor = window.DataIntegrityAuditor;
  const registry = window.moduleRegistry;

  // DOM Elements
  const themeToggle = document.getElementById('theme-toggle');
  const btnLoadSamples = document.getElementById('btn-load-samples');

  // Vault Slots
  const prevDropzone = document.getElementById('dropzone-prev-orders');
  const prevFileInput = document.getElementById('input-prev-orders');
  const currDropzone = document.getElementById('dropzone-curr-orders');
  const currFileInput = document.getElementById('input-curr-orders');
  const prodDropzone = document.getElementById('dropzone-products');
  const prodFileInput = document.getElementById('input-products');
  const recDropzone = document.getElementById('dropzone-receptions');
  const recFileInput = document.getElementById('input-receptions');
  const errDropzone = document.getElementById('dropzone-errors');
  const errFileInput = document.getElementById('input-errors');

  const btnSaveOrders = document.getElementById('btn-save-orders');
  const btnSaveProducts = document.getElementById('btn-save-products');
  const btnSaveReceptions = document.getElementById('btn-save-receptions');
  const btnSaveErrors = document.getElementById('btn-save-errors');

  // Action Cards (Col 2)
  const actionList = document.getElementById('analysis-action-list');

  // Result Pane (Col 3)
  const resultContainer = document.getElementById('result-column-body');
  const viewTabs = document.getElementById('view-tabs');

  // 슬롯 메타데이터 정의 (실제 첨부되는 5개 원본 파일 슬롯)
  const slotMetaMap = {
    prevOrders: { name: '1-1. 화원사 발주(이전)', badgeId: 'badge-prev-orders', labelId: 'label-prev-orders', cancelBtnId: 'btn-cancel-prev-orders', inputId: 'input-prev-orders' },
    currOrders: { name: '1-2. 화원사 발주(현재)', badgeId: 'badge-curr-orders', labelId: 'label-curr-orders', cancelBtnId: 'btn-cancel-curr-orders', inputId: 'input-curr-orders' },
    products: { name: '1-3. 화원사 상품진행', badgeId: 'badge-products', labelId: 'label-products', cancelBtnId: 'btn-cancel-products', inputId: 'input-products' },
    receptions: { name: '3. 상담원 접수(excel)', badgeId: 'badge-receptions', labelId: 'label-receptions', cancelBtnId: 'btn-cancel-receptions', inputId: 'input-receptions' },
    errors: { name: '4. 상담원 오류(excel)', badgeId: 'badge-errors', labelId: 'label-errors', cancelBtnId: 'btn-cancel-errors', inputId: 'input-errors' }
  };

  // 슬롯별 UI 갱신 함수
  const updateSlotUI = (slotKey) => {
    const meta = slotMetaMap[slotKey];
    if (!meta) return;
    const slot = store.getVaultData(slotKey);
    const badge = document.getElementById(meta.badgeId);
    const label = document.getElementById(meta.labelId);
    const cancelBtn = document.getElementById(meta.cancelBtnId);
    if (!badge || !label) return;

    if (slot && slot.rows && slot.rows.length > 0) {
      const rowCount = slot.rows.length;
      label.innerText = `📄 ${slot.fileName} (${rowCount.toLocaleString()}건)`;
      if (slot.audit && slot.audit.isIntegrityPassed) {
        badge.innerText = `누락 0건 (DB 미저장)`;
        badge.className = 'slot-badge badge-ready';
      } else {
        const missing = slot.audit?.totalMissingCells || 0;
        badge.innerText = missing > 0 ? `누락 ${missing}건 (DB 미저장)` : `정상 (${rowCount}건)`;
        badge.className = 'slot-badge badge-ready';
      }
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
    } else {
      label.innerText = `📂 ${meta.name} 불러오기 또는 드롭 (.xlsx)`;
      badge.innerText = '대기중';
      badge.className = 'slot-badge badge-empty';
      if (cancelBtn) cancelBtn.style.display = 'none';
    }
  };

  // 저장 버튼들 UI 상태 일괄 갱신
  const updateSaveButtonsUI = () => {
    const prev = store.getVaultData('prevOrders');
    const curr = store.getVaultData('currOrders');
    const prod = store.getVaultData('products');
    const rec = store.getVaultData('receptions');
    const err = store.getVaultData('errors');

    if (btnSaveOrders) {
      if (prev && curr) {
        btnSaveOrders.innerText = '✅ 1-1, 1-2. 화원사 발주 데이터 로드 완료 (DB 미저장)';
        btnSaveOrders.className = 'btn btn-primary';
      } else if (prev || curr) {
        btnSaveOrders.innerText = '📂 1. 화원사 발주 데이터 (나머지 파일 필요)';
        btnSaveOrders.className = 'btn btn-secondary';
      } else {
        btnSaveOrders.innerText = '📊 1-1, 1-2. 화원사 발주 분석 실행';
        btnSaveOrders.className = 'btn btn-secondary';
      }
    }

    if (btnSaveProducts) {
      btnSaveProducts.innerText = prod ? '✅ 1-3. 화원사 상품진행 로드 완료 (DB 미저장)' : '📊 1-3. 화원사 상품진행 원본데이터 확인';
      btnSaveProducts.className = prod ? 'btn btn-primary' : 'btn btn-secondary';
    }

    if (btnSaveReceptions) {
      btnSaveReceptions.innerText = rec ? '✅ 3. 상담원 접수 로드 완료 (DB 미저장)' : '📊 3. 상담원 접수 원본데이터 확인';
      btnSaveReceptions.className = rec ? 'btn btn-primary' : 'btn btn-secondary';
    }

    if (btnSaveErrors) {
      btnSaveErrors.innerText = err ? '✅ 4. 상담원 오류 로드 완료 (DB 미저장)' : '📊 4. 상담원 오류 원본데이터 확인';
      btnSaveErrors.className = err ? 'btn btn-primary' : 'btn btn-secondary';
    }
  };

  const updateAllSlotsUI = () => {
    Object.keys(slotMetaMap).forEach(key => updateSlotUI(key));
    updateSaveButtonsUI();
  };

  // 테마 관리
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle.innerText = theme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드';
  };
  applyTheme(store.state.theme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = store.state.theme === 'dark' ? 'light' : 'dark';
    store.state.theme = nextTheme;
    applyTheme(nextTheme);
    if (store.state.currentAnalysis === 'all') {
      runAllAnalyses(false);
    } else if (store.state.currentAnalysis) {
      runSingleAnalysis(store.state.currentAnalysis, false);
    }
  });

  // 드롭존 설정 헬퍼
  const setupDropzone = (dropzone, fileInput, onFileSelected) => {
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onFileSelected(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        onFileSelected(e.target.files[0]);
      }
    });
  };

  /**
   * [핵심] 불러온 원본 데이터 실물 표 렌더링 함수
   * 사용자가 파일을 불러오거나 탭을 클릭했을 때 원본 엑셀 행/열 전체를 표로 출력합니다.
   */
  const renderRawSlotView = (slotKey) => {
    store.state.lastViewedSlot = slotKey;
    try { localStorage.setItem('cmwork_last_analysis_mode', 'raw_' + slotKey); } catch (e) {}
    const slotData = store.getVaultData(slotKey);
    const meta = slotMetaMap[slotKey] || { name: slotKey };

    // 탭 상태 활성화
    if (viewTabs) {
      viewTabs.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-slot') === slotKey);
      });
    }

    if (!slotData || !slotData.rows || slotData.rows.length === 0) {
      resultContainer.innerHTML = `
        <div class="col-3-empty">
          <div style="font-size: 36px;">📂</div>
          <div style="font-size: 15px; font-weight: 700;">[${meta.name}] 원본 데이터가 아직 없습니다</div>
          <div style="font-size: 12px; max-width: 360px; line-height: 1.5; margin-top: 8px;">
            왼쪽 [칼럼 1: 원본 데이터 보관]의 해당 드롭존을 클릭하여 엑셀(.xlsx) 파일을 불러오시면 원본 데이터 표가 즉시 표시되고 안전하게 영구 저장됩니다.
          </div>
        </div>
      `;
      return;
    }

    resultContainer.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'result-container';

    // 1. 원본 데이터 실물 표 렌더링
    window.TableRenderer.renderRawDataTable(container, slotData.rows, `${meta.name}`, {
      fileName: slotData.fileName,
      totalRows: slotData.rows.length,
      audit: slotData.audit
    });

    // 2. 해당 슬롯과 직결된 분석 모듈이 있다면 하단에 함께 즉시 렌더링 (원클릭 분석 연동)
    if (slotKey === 'receptions' && window.ReceptionCountModule) {
      try {
        const out = window.ReceptionCountModule.execute(slotData.rows);
        const subBox = document.createElement('div');
        subBox.style.marginTop = '28px';
        subBox.style.borderTop = '2px dashed var(--accent-indigo)';
        subBox.style.paddingTop = '20px';
        subBox.innerHTML = `<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: var(--accent-indigo);">📊 [연관 분석 결과] 당월 접수 수량 및 일자별 집계표</h3>`;
        window.TableRenderer.render(subBox, out.columns, out.data, out.title);
        container.appendChild(subBox);
      } catch (e) {
        console.warn('연관 접수 분석 렌더링 생략:', e);
      }
    } else if (slotKey === 'errors' && window.ErrorAnalysisModule) {
      try {
        const out = window.ErrorAnalysisModule.execute(slotData.rows);
        const subBox = document.createElement('div');
        subBox.style.marginTop = '28px';
        subBox.style.borderTop = '2px dashed #ef4444';
        subBox.style.paddingTop = '20px';
        subBox.innerHTML = `<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #ef4444;">⚠️ [연관 분석 결과] 당월 오류 및 실수금액 집계표</h3>`;
        window.TableRenderer.renderMultiTables(subBox, out.tables, out.title);
        container.appendChild(subBox);
      } catch (e) {
        console.warn('연관 오류 분석 렌더링 생략:', e);
      }
    } else if (slotKey === 'products' && window.ProductProgressModule) {
      try {
        const out = window.ProductProgressModule.execute(slotData.rows);
        const subBox = document.createElement('div');
        subBox.style.marginTop = '28px';
        subBox.style.borderTop = '2px dashed var(--accent-emerald)';
        subBox.style.paddingTop = '20px';
        subBox.innerHTML = `<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: var(--accent-emerald);">🚚 [연관 분석 결과] 농장별 완료건 집계표</h3>`;
        window.TableRenderer.render(subBox, out.columns, out.data, out.title);
        container.appendChild(subBox);
      } catch (e) {
        console.warn('연관 상품 분석 렌더링 생략:', e);
      }
    }

    resultContainer.appendChild(container);
  };

  // 슬롯 파일 처리 함수 (불러오기 + DB 미저장 메모리 등록 + 실물 표 즉시 표시)
  const processSlotFile = async (file, slotKey, badgeId, labelId) => {
    const badge = document.getElementById(badgeId);
    const label = document.getElementById(labelId);
    if (!badge || !label) return;
    badge.innerText = '검사 및 로드중...';
    badge.className = 'slot-badge badge-empty';

    try {
      const result = await auditor.auditExcelFile(file);

      // 현재 세션 메모리에만 등록 (Supabase / IndexedDB 등 외부·로컬 DB 저장 안 함)
      await store.setVaultData(slotKey, {
        fileName: file.name,
        rows: result.rows,
        audit: result.audit
      });

      // UI 갱신
      updateAllSlotsUI();

      // [핵심] 불러온 원본 데이터를 즉시 화면 3열에 실물 표로 렌더링!
      renderRawSlotView(slotKey);

      // 사용자 피드백 토스트
      const slotName = slotMetaMap[slotKey]?.name || slotKey;
      showToast(`[${slotName}] ${result.rows.length.toLocaleString()}건 불러오기 완료! (DB 저장 안 함)`, 'success');

    } catch (err) {
      console.error(err);
      alert(`파일 검증 및 로드 오류 [${file.name}]: ` + err.message);
      badge.innerText = '오류';
      badge.className = 'slot-badge badge-error';
    }
  };

  // 5개 원본 엑셀 슬롯 드롭존 이벤트 연결
  setupDropzone(prevDropzone, prevFileInput, (file) => processSlotFile(file, 'prevOrders', 'badge-prev-orders', 'label-prev-orders'));
  setupDropzone(currDropzone, currFileInput, (file) => processSlotFile(file, 'currOrders', 'badge-curr-orders', 'label-curr-orders'));
  setupDropzone(prodDropzone, prodFileInput, (file) => processSlotFile(file, 'products', 'badge-products', 'label-products'));
  setupDropzone(recDropzone, recFileInput, (file) => processSlotFile(file, 'receptions', 'badge-receptions', 'label-receptions'));
  setupDropzone(errDropzone, errFileInput, (file) => processSlotFile(file, 'errors', 'badge-errors', 'label-errors'));

  // 1. 발주 원본데이터 분석 버튼
  if (btnSaveOrders) {
    btnSaveOrders.addEventListener('click', () => {
      const prev = store.getVaultData('prevOrders');
      const curr = store.getVaultData('currOrders');

      if (!prev) {
        prevFileInput.click();
        return;
      }
      if (!curr) {
        currFileInput.click();
        return;
      }

      showToast('📊 1-1, 1-2. 화원사 발주 원본데이터 분석을 실행합니다. (DB 저장 안 함)', 'success');
      runAllAnalyses(true);
    });
  }

  // 1-3. 화원사 상품 진행 원본데이터 확인 버튼
  if (btnSaveProducts) {
    btnSaveProducts.addEventListener('click', () => {
      const prod = store.getVaultData('products');
      if (!prod) {
        prodFileInput.click();
        return;
      }
      showToast('📊 1-3. 화원사 상품진행 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('products');
    });
  }

  // 3. 상담원 접수 원본데이터 확인 버튼
  if (btnSaveReceptions) {
    btnSaveReceptions.addEventListener('click', () => {
      const rec = store.getVaultData('receptions');
      if (!rec) {
        recFileInput.click();
        return;
      }
      showToast('📊 3. 상담원 접수 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('receptions');
    });
  }

  // 4. 상담원 오류 원본데이터 확인 버튼
  if (btnSaveErrors) {
    btnSaveErrors.addEventListener('click', () => {
      const errData = store.getVaultData('errors');
      if (!errData) {
        errFileInput.click();
        return;
      }
      showToast('📊 4. 상담원 오류 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('errors');
    });
  }

  // 개별 슬롯 업로드 데이터 취소 함수
  const cancelSlotData = async (slotKey) => {
    const meta = slotMetaMap[slotKey];
    if (!meta) return;
    const currentSlot = store.getVaultData(slotKey);
    if (!currentSlot) return;

    const confirmMsg = `[${meta.name}] 데이터를 취소하시겠습니까?\n취소 시 업로드된 파일 정보와 데이터가 즉시 초기화됩니다.`;
    if (!confirm(confirmMsg)) {
      return;
    }

    // 1. 상태 및 IndexedDB / 세션스토리지에서 슬롯 데이터 제거
    await store.setVaultData(slotKey, null);

    // 2. 파일 input value 초기화 (동일 파일 재업로드 시 이벤트 감지 보장)
    const fileInput = document.getElementById(meta.inputId);
    if (fileInput) fileInput.value = '';

    // 3. UI 갱신 (뱃지 대기중, 취소 버튼 숨김, 버튼 라벨 갱신)
    updateAllSlotsUI();

    // 4. 화면 및 분석 결과 갱신
    if (store.state.lastViewedSlot === slotKey) {
      // 보고 있던 원본 데이터 슬롯이 취소된 경우 빈 화면 안내
      renderRawSlotView(slotKey);
    } else {
      // 분석 결과 화면이었을 경우 최신 상태로 재실행
      if (store.state.currentAnalysis === 'all') {
        runAllAnalyses(false);
      } else if (store.state.currentAnalysis) {
        runSingleAnalysis(store.state.currentAnalysis, false);
      }
    }

    showToast(`[${meta.name}] 업로드 데이터가 성공적으로 취소되었습니다.`, 'info');
  };

  // 각 슬롯별 [✕ 취소] 버튼 이벤트 바인딩
  document.querySelectorAll('.btn-cancel-slot').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // 부모 클릭 방지
      const slotKey = btn.getAttribute('data-slot');
      if (slotKey) {
        cancelSlotData(slotKey);
      }
    });
  });

  // 상단 탭 버튼 클릭 이벤트 바인딩
  if (viewTabs) {
    viewTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;

      const viewType = btn.getAttribute('data-view');
      const slotKey = btn.getAttribute('data-slot');

      viewTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (viewType === 'analysis') {
        runAllAnalyses(false);
      } else if (viewType === 'staffSummary') {
        runSingleAnalysis('staffSummary', false);
      } else if (slotKey) {
        renderRawSlotView(slotKey);
      }
    });
  }

  /**
   * 전체 종합 분석 (All-in-One Dashboard)
   */
  const runAllAnalyses = (animate = true) => {
    const prev = store.getVaultData('prevOrders');
    const curr = store.getVaultData('currOrders');
    const prod = store.getVaultData('products');
    const rec = store.getVaultData('receptions');
    const err = store.getVaultData('errors');

    // 탭 상태 활성화
    if (viewTabs) {
      viewTabs.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-view') === 'analysis');
      });
    }

    // 칼럼 2 활성 카드 갱신
    document.querySelectorAll('.action-card').forEach(c => c.classList.remove('active'));
    const allCard = document.querySelector('[data-module-id="all"]');
    if (allCard) allCard.classList.add('active');

    // 만약 파일이 없으면 안내 화면
    if (!prev && !curr && !prod && !rec && !err) {
      resultContainer.innerHTML = `
        <div class="col-3-empty">
          <div style="font-size: 36px;">📈</div>
          <div style="font-size: 15px; font-weight: 700;">불러온 데이터가 없습니다</div>
          <div style="font-size: 12px; max-width: 360px; line-height: 1.5; margin-top: 8px;">
            [칼럼 1: 원본 데이터 보관]에서 엑셀 파일을 불러오시면 원본 데이터 표와 분석 결과가 즉시 표시됩니다.
          </div>
        </div>
      `;
      return;
    }

    const orderTrendMod = registry.get('orderTrend');
    const floristRankMod = registry.get('topFlorists');
    const productProgMod = registry.get('productProgress');

    let trendOutput = null;
    let floristOutput = null;
    let prodOutput = null;

    if (prev && curr && prev.rows && curr.rows && orderTrendMod && floristRankMod) {
      trendOutput = orderTrendMod.execute(prev.rows, curr.rows);
      floristOutput = floristRankMod.execute(prev.rows, curr.rows, 10);
    } else if (store.state.analysisResults) {
      if (store.state.analysisResults.orderTrend) {
        trendOutput = store.state.analysisResults.orderTrend;
      }
      if (store.state.analysisResults.topFlorists) {
        floristOutput = store.state.analysisResults.topFlorists;
      }
    }

    if (prod && prod.rows && productProgMod) {
      prodOutput = productProgMod.execute(prod.rows);
    } else if (store.state.analysisResults && store.state.analysisResults.productProgress) {
      prodOutput = store.state.analysisResults.productProgress;
    }

    store.state.currentAnalysis = 'all';
    try { localStorage.setItem('cmwork_last_analysis_mode', 'all'); } catch (e) {}
    renderAllInOneDashboard(trendOutput, floristOutput, prodOutput, animate);
  };

  /**
   * 한 화면에 1번~5번 전체 분석 결과를 펼쳐서 렌더링
   */
  const renderAllInOneDashboard = (trendOutput, floristOutput, prodOutput, animate = true) => {
    resultContainer.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'result-container';

    // 대시보드 헤더
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.paddingBottom = '16px';
    header.style.borderBottom = '1px solid var(--border-color)';
    header.innerHTML = `
      <div>
        <h2 style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">📊 전체 종합 분석 결과 (All-in-One Dashboard)</h2>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
          모든 결과는 사용자 헌장 및 지침에 따라 <strong>표(Table)</strong> 중심으로 실시간 렌더링됩니다.
        </div>
      </div>
      <span class="slot-badge badge-ready" style="font-size: 11px; padding: 4px 8px;">실시간 자동 갱신됨</span>
    `;
    container.appendChild(header);

    // 1-1. 화원사 발주 추이 표
    if (trendOutput) {
      const section1 = document.createElement('div');
      section1.style.marginTop = '20px';
      section1.innerHTML = `
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-indigo);">📦 [결과 1-1]</span>
          <span>1-1. 화원사 발주(이전) 대비 1-2. 화원사 발주(현재) 추이 변화표</span>
        </div>
      `;
      const tableBox1 = document.createElement('div');
      window.TableRenderer.render(tableBox1, trendOutput.columns, trendOutput.data, '1-1. 화원사 발주(이전) 대비 1-2. 화원사 발주(현재) 추이 비교');
      section1.appendChild(tableBox1);
      container.appendChild(section1);
    }

    // 1-2. 발주증가 화원사 1~10위 표 및 그래프
    if (floristOutput) {
      const section2 = document.createElement('div');
      section2.style.marginTop = '28px';
      section2.innerHTML = `
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-indigo);">🏆 [결과 1-2]</span>
          <span>1-2. 화원사 발주증가 1위~10위 추출 (화원사의 체인발주 수량)</span>
        </div>
      `;
      const tableBox2 = document.createElement('div');
      window.TableRenderer.render(tableBox2, floristOutput.columns, floristOutput.tableData, '1-2. 화원사 발주증가 1위~10위 추출 (화원사의 체인발주 수량)');
      section2.appendChild(tableBox2);

      const chartBox = document.createElement('div');
      section2.appendChild(chartBox);
      window.ChartRenderer.render(chartBox, floristOutput.chartData, '1-2. 화원사 발주증가 1위~10위 시각화 (화원사의 체인발주 수량 순증가 기준)');

      container.appendChild(section2);
    }

    // 1-3. 화원사 상품진행 분석 표
    if (prodOutput) {
      const section3 = document.createElement('div');
      section3.style.marginTop = '28px';
      section3.innerHTML = `
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-emerald);">🚚 [결과 1-3]</span>
          <span>1-3. 화원사 상품진행 - 농장별 특정 상품 완료 건수 집계표 (특·특대·4단·5단·짱구 완료건)</span>
        </div>
      `;
      const tableBox3 = document.createElement('div');
      window.TableRenderer.render(tableBox3, prodOutput.columns, prodOutput.data, prodOutput.title);
      section3.appendChild(tableBox3);
      container.appendChild(section3);
    }

    // 3. 상담원 접수 수량 표
    const recVault = store.getVaultData('receptions');
    if (recVault && recVault.rows && window.ReceptionCountModule) {
      try {
        const recOutput = window.ReceptionCountModule.execute(recVault.rows);
        const section4 = document.createElement('div');
        section4.style.marginTop = '28px';
        section4.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--accent-indigo);">📋 [결과 3]</span>
            <span>3. 상담원 접수(excel) 수량 집계 (기준: 접수자, 배송일, 완료)</span>
          </div>
        `;
        const tableBox4 = document.createElement('div');
        window.TableRenderer.render(tableBox4, recOutput.columns, recOutput.data, recOutput.title);
        section4.appendChild(tableBox4);
        container.appendChild(section4);
      } catch (e) {
        console.warn('접수 분석 오류:', e);
      }
    }

    // 4. 상담원 오류 표
    const errVault = store.getVaultData('errors');
    if (errVault && errVault.rows && window.ErrorAnalysisModule) {
      try {
        const errOutput = window.ErrorAnalysisModule.execute(errVault.rows);
        const section5 = document.createElement('div');
        section5.style.marginTop = '28px';
        section5.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="color: #ef4444;">⚠️ [결과 4]</span>
            <span>4. 상담원 오류(excel) 분석 (기준: 실수자, 처리일시, 실수금액, 실수유형)</span>
          </div>
        `;
        const tableBox5 = document.createElement('div');
        window.TableRenderer.renderMultiTables(tableBox5, errOutput.tables, errOutput.title);
        section5.appendChild(tableBox5);
        container.appendChild(section5);
      } catch (e) {
        console.warn('오류 분석 실패:', e);
      }
    }

    // 5. 상담원 실적 종합 집계 표 (3번 접수 + 4번 오류 교차 분석)
    if (window.StaffSummaryModule && ((recVault && recVault.rows) || (errVault && errVault.rows))) {
      try {
        const staffOutput = window.StaffSummaryModule.execute(recVault?.rows, errVault?.rows);
        const section6 = document.createElement('div');
        section6.style.marginTop = '28px';
        section6.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="color: #8b5cf6;">🎯 [결과 5]</span>
            <span>5. 상담원 실적 분석결과표 (3.상담원 접수와 4.상담원 오류 기반 교차 분석)</span>
          </div>
        `;
        const tableBox6 = document.createElement('div');
        window.TableRenderer.render(tableBox6, staffOutput.columns, staffOutput.data, staffOutput.title);
        section6.appendChild(tableBox6);
        container.appendChild(section6);
      } catch (e) {
        console.warn('상담원 실적 집계 실패:', e);
      }
    }

    resultContainer.appendChild(container);
  };

  /**
   * 단일 모듈만 개별 보기로 실행
   */
  const runSingleAnalysis = (moduleId, animate = true) => {
    const module = registry.get(moduleId);
    if (!module) return;

    let output = null;

    if (moduleId === 'productProgress') {
      const prod = store.getVaultData('products');
      if (!prod) {
        prodFileInput.click();
        return;
      }
      output = module.execute(prod.rows);
    } else if (moduleId === 'receptionCount') {
      const rec = store.getVaultData('receptions') || store.getVaultData('products');
      if (!rec) {
        recFileInput.click();
        return;
      }
      output = module.execute(rec.rows);
    } else if (moduleId === 'errorAnalysis') {
      const errData = store.getVaultData('errors');
      if (!errData) {
        errFileInput.click();
        return;
      }
      output = module.execute(errData.rows);
    } else if (moduleId === 'staffSummary') {
      const rec = store.getVaultData('receptions');
      const errData = store.getVaultData('errors');
      if (!rec && !errData) {
        if (!rec) recFileInput.click();
        else errFileInput.click();
        showToast('5. 상담원 실적 분석을 위해 먼저 [3. 상담원 접수]와 [4. 상담원 오류] 파일을 불러와주세요.', 'info');
        return;
      }
      output = module.execute(rec ? rec.rows : null, errData ? errData.rows : null);
    } else {
      const prev = store.getVaultData('prevOrders');
      const curr = store.getVaultData('currOrders');
      if (!prev || !curr) {
        if (!prev) prevFileInput.click();
        else currFileInput.click();
        return;
      }
      output = module.execute(prev.rows, curr.rows);
    }

    document.querySelectorAll('.action-card').forEach(c => c.classList.remove('active'));
    const activeCard = document.querySelector(`[data-module-id="${moduleId}"]`);
    if (activeCard) activeCard.classList.add('active');

    try {
      store.setAnalysisResult(moduleId, output);
      try { localStorage.setItem('cmwork_last_analysis_mode', moduleId); } catch (e) {}
      renderSingleResult(output, animate);
    } catch (err) {
      alert(`분석 오류: ${err.message}`);
    }
  };

  const renderSingleResult = (output, animate = true) => {
    resultContainer.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'result-container';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.innerHTML = `
      <div>
        <h2 style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">${output.title}</h2>
        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">개별 분석 뷰 | 표(Table) 중심 실시간 렌더링</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary" id="btn-back-to-all" style="width: auto; padding: 6px 12px; font-size: 11px;">
          전체 종합 뷰로 보기 ➔
        </button>
      </div>
    `;
    container.appendChild(header);

    header.querySelector('#btn-back-to-all').addEventListener('click', () => runAllAnalyses());

    if (output.kpis && output.kpis.length > 0) {
      const kpiRow = document.createElement('div');
      kpiRow.className = 'kpi-row';
      output.kpis.forEach(kpi => {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        const posClass = kpi.isPositive ? 'text-positive' : (kpi.isPositive === false ? 'text-negative' : '');
        card.innerHTML = `
          <div class="kpi-label">${kpi.label}</div>
          <div class="kpi-value ${posClass}">${kpi.value}</div>
          <div class="kpi-sub">${kpi.sub}</div>
        `;
        kpiRow.appendChild(card);
      });
      container.appendChild(kpiRow);
    }

    const tableBox = document.createElement('div');
    container.appendChild(tableBox);

    // [핵심] 5. 상담원 실적 창: 접수와 오류를 먼저 보여주고, 그 다음 분석해서 결과를 보여주는 3단계 뷰!
    if (output.id === 'staffSummary') {
      const noticeBox = document.createElement('div');
      noticeBox.style.background = 'rgba(99, 102, 241, 0.1)';
      noticeBox.style.border = '1px solid rgba(99, 102, 241, 0.3)';
      noticeBox.style.borderRadius = '8px';
      noticeBox.style.padding = '12px 16px';
      noticeBox.style.marginBottom = '20px';
      noticeBox.style.fontSize = '13px';
      noticeBox.style.lineHeight = '1.6';
      noticeBox.innerHTML = `
        💡 <strong>[상담원 실적 분석 구조 안내]</strong> 5. 상담원 실적은 별도 엑셀 파일을 첨부하는 슬롯이 아니며, 앞서 불러온 <strong>[3. 상담원 접수]</strong> 데이터와 <strong>[4. 상담원 오류]</strong> 데이터를 상호 대조하고 교차 분석하여 상담원별 최종 실적 결과를 도출하는 통합 분석 창입니다.
      `;
      tableBox.appendChild(noticeBox);

      // 1단계: 3. 상담원 접수 현황
      if (output.recRes && output.recRes.columns && output.recRes.data) {
        const step1 = document.createElement('div');
        step1.style.marginBottom = '28px';
        step1.innerHTML = `<h3 style="font-size: 15px; font-weight: 700; margin-bottom: 10px; color: var(--accent-indigo); display: flex; align-items: center; gap: 6px;"><span>📋 1단계:</span><span>3. 상담원 접수(excel) 현황표 (기준: 접수자, 배송일, 완료)</span></h3>`;
        window.TableRenderer.render(step1, output.recRes.columns, output.recRes.data, output.recRes.title || '3. 상담원 접수 현황');
        tableBox.appendChild(step1);
      }

      // 2단계: 4. 상담원 오류 현황
      if (output.errRes && output.errRes.tables) {
        const step2 = document.createElement('div');
        step2.style.marginBottom = '28px';
        step2.style.borderTop = '2px dashed #ef4444';
        step2.style.paddingTop = '20px';
        step2.innerHTML = `<h3 style="font-size: 15px; font-weight: 700; margin-bottom: 10px; color: #ef4444; display: flex; align-items: center; gap: 6px;"><span>⚠️ 2단계:</span><span>4. 상담원 오류(excel) 및 실수금액 현황표</span></h3>`;
        window.TableRenderer.renderMultiTables(step2, output.errRes.tables, output.errRes.title || '4. 상담원 오류 현황');
        tableBox.appendChild(step2);
      }

      // 3단계: [최종 분석 결과] 5. 상담원 실적 종합 집계표
      const step3 = document.createElement('div');
      step3.style.borderTop = '2px dashed #8b5cf6';
      step3.style.paddingTop = '20px';
      step3.innerHTML = `<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #8b5cf6; display: flex; align-items: center; gap: 6px;"><span>🎯 3단계 [최종 교차 분석 결과]:</span><span>5. 상담원 실적 종합 집계표</span></h3>`;
      window.TableRenderer.render(step3, output.columns, output.data, output.title || '5. 상담원 실적 종합 집계표');
      tableBox.appendChild(step3);

      // 4단계: [체인팀 전용 분리 집계] 체인팀 개인별 실적 최종 집계표 (고객접수 vs 파란접수)
      if (output.chainSummaryTable && output.chainSummaryTable.data) {
        const step4 = document.createElement('div');
        step4.style.borderTop = '2px dashed var(--accent-indigo)';
        step4.style.paddingTop = '20px';
        step4.style.marginTop = '28px';
        step4.innerHTML = `<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: var(--accent-indigo); display: flex; align-items: center; gap: 6px;"><span>🎯 4단계 [체인팀 전용 분리 집계]:</span><span>${output.chainSummaryTable.title}</span></h3>`;
        window.TableRenderer.render(step4, output.chainSummaryTable.columns, output.chainSummaryTable.data, output.chainSummaryTable.title);
        tableBox.appendChild(step4);
      }

    } else if (output.type === 'multi_tables') {
      window.TableRenderer.renderMultiTables(tableBox, output.tables, output.title);
    } else if (output.type === 'table_only') {
      window.TableRenderer.render(tableBox, output.columns, output.data, output.title);
      if (output.subData && output.subData.length > 0) {
        const subBox = document.createElement('div');
        subBox.style.marginTop = '24px';
        window.TableRenderer.render(subBox, output.subColumns, output.subData, output.subTitle || '상세 내역');
        container.appendChild(subBox);
      }
    } else if (output.type === 'table_and_chart') {
      window.TableRenderer.render(tableBox, output.columns, output.tableData, output.title);
      const chartBox = document.createElement('div');
      container.appendChild(chartBox);
      window.ChartRenderer.render(chartBox, output.chartData, 'TOP 10 화원사 발주 비교 그래프');
    }

    resultContainer.appendChild(container);
  };

  // 모듈 버튼 렌더링 (칼럼 2)
  const renderActionCards = () => {
    actionList.innerHTML = '';

    const allCard = document.createElement('div');
    allCard.className = 'action-card active';
    allCard.setAttribute('data-module-id', 'all');
    allCard.style.borderColor = 'var(--accent-indigo)';
    allCard.innerHTML = `
      <div class="card-title" style="color: var(--accent-indigo);">
        <span>🌟</span>
        <span>전체 종합 분석 (All-in-One)</span>
      </div>
      <div class="card-desc">1-1번(화원사 발주 추이 표), 1-2번(발주증가 TOP 10 표+차트), 1-3번(화원사 상품진행), 3번(상담원 접수), 4번(상담원 오류), 5번(상담원 개인별 집계)을 한 화면에 모두 펼쳐서 분석합니다.</div>
      <button class="btn btn-primary" id="btn-run-all">
        전체 결과 한 화면에 보기 ➔
      </button>
    `;
    allCard.addEventListener('click', () => runAllAnalyses());
    actionList.appendChild(allCard);

    // 개별 모듈 버튼들
    const modules = registry.getAll();
    modules.forEach(mod => {
      const card = document.createElement('div');
      card.className = 'action-card';
      card.setAttribute('data-module-id', mod.id);
      card.innerHTML = `
        <div class="card-title">
          <span>${mod.icon || '⚡'}</span>
          <span>${mod.name}</span>
        </div>
        <div class="card-desc">${mod.description}</div>
        <button class="btn btn-secondary" style="font-size: 12px;">
          개별 결과 보기 ➔
        </button>
      `;

      card.addEventListener('click', () => runSingleAnalysis(mod.id));
      actionList.appendChild(card);
    });
  };

  renderActionCards();

  // 샘플 데이터 원클릭 로드 (초기 검증 및 데모)
  btnLoadSamples.addEventListener('click', async () => {
    btnLoadSamples.innerText = '샘플 로드중...';
    try {
      if (window.SAMPLE_DATA_BUNDLE) {
        const bundle = window.SAMPLE_DATA_BUNDLE;
        for (const [slotKey, rows] of Object.entries(bundle)) {
          await store.setVaultData(slotKey, {
            fileName: slotKey + '_sample.xlsx',
            rows: rows,
            audit: { isIntegrityPassed: true, totalMissingCells: 0 }
          });
        }
        updateAllSlotsUI();
        btnLoadSamples.innerText = '⚡ 샘플 데이터 원클릭 로드';
        showToast('전체 5종 원본 샘플 로드 완료! (5.상담원 실적은 3번 접수+4번 오류로 자동 산출)', 'success');
        runAllAnalyses(true);
        return;
      }

      const loadRemoteExcel = async (url, fileName) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      };

      const [prevFile, currFile, prodFile, recFile, errFile] = await Promise.all([
        loadRemoteExcel('./data/sample_prev_orders.xlsx', 'sample_prev_orders.xlsx'),
        loadRemoteExcel('./data/sample_curr_orders.xlsx', 'sample_curr_orders.xlsx'),
        loadRemoteExcel('./data/sample_products.xlsx', 'sample_products.xlsx'),
        loadRemoteExcel('./data/sample_receipts.xlsx', 'sample_receipts.xlsx'),
        loadRemoteExcel('./data/sample_errors.xlsx', 'sample_errors.xlsx')
      ]);

      await processSlotFile(prevFile, 'prevOrders', 'badge-prev-orders', 'label-prev-orders');
      await processSlotFile(currFile, 'currOrders', 'badge-curr-orders', 'label-curr-orders');
      await processSlotFile(prodFile, 'products', 'badge-products', 'label-products');
      await processSlotFile(recFile, 'receptions', 'badge-receptions', 'label-receptions');
      await processSlotFile(errFile, 'errors', 'badge-errors', 'label-errors');

      btnLoadSamples.innerText = '⚡ 샘플 데이터 원클릭 로드';
      showToast('전체 5종 원본 엑셀 로드 완료! (5.상담원 실적은 3번 접수+4번 오류로 자동 산출)', 'success');
      runAllAnalyses(true);
    } catch (err) {
      console.error(err);
      alert('샘플 파일 로드 실패: ' + err.message);
      btnLoadSamples.innerText = '⚡ 샘플 데이터 원클릭 로드';
    }
  });

  // 웹사이트 주소(URL) 원클릭 복사 버튼 & 팀원 공유 스마트 안내 모달
  const btnCopyShareUrl = document.getElementById('btn-copy-share-url');
  const shareGuideModal = document.getElementById('share-guide-modal');
  const modalCurrentUrl = document.getElementById('modal-current-url');
  const btnCloseShareModal = document.getElementById('btn-close-share-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnForceCopyUrl = document.getElementById('btn-force-copy-url');

  const openShareGuideModal = () => {
    if (modalCurrentUrl) {
      modalCurrentUrl.textContent = window.location.href;
    }
    if (shareGuideModal) {
      shareGuideModal.classList.add('active');
      shareGuideModal.setAttribute('aria-hidden', 'false');
    }
  };

  const closeShareGuideModal = () => {
    if (shareGuideModal) {
      shareGuideModal.classList.remove('active');
      shareGuideModal.setAttribute('aria-hidden', 'true');
    }
  };

  if (btnCloseShareModal) btnCloseShareModal.addEventListener('click', closeShareGuideModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeShareGuideModal);
  if (shareGuideModal) {
    shareGuideModal.addEventListener('click', (e) => {
      if (e.target === shareGuideModal) closeShareGuideModal();
    });
  }

  if (btnForceCopyUrl) {
    btnForceCopyUrl.addEventListener('click', async () => {
      const shareUrl = window.location.href;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('로컬 주소가 복사되었습니다. (⚠️ 다른 컴퓨터에서는 열리지 않습니다)', 'warning');
      } catch (e) {
        prompt('아래 주소를 복사하세요 (로컬 주소는 다른 PC에서 열리지 않음):', shareUrl);
      }
      closeShareGuideModal();
    });
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', async () => {
      const isLocalFile = window.location.protocol === 'file:';
      if (isLocalFile) {
        // 로컬 환경일 경우 팀원이 열지 못하는 문제를 방지하기 위해 안내 모달을 띄움
        openShareGuideModal();
      } else {
        // 실제 배포된 웹사이트(http/https)인 경우
        const shareUrl = window.location.href;
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('웹사이트 주소가 복사되었습니다! (분석 결과 전달은 [피드백 노트]의 HTML 리포트 다운로드를 권장합니다)', 'success');
        } catch (e) {
          prompt('아래 웹사이트 주소를 복사하여 팀원에게 공유하세요:', shareUrl);
        }
      }
    });
  }

  // 화면(IndexedDB 및 세션) 새로고침(리셋) 버튼
  const btnClearSession = document.getElementById('btn-clear-session');
  if (btnClearSession) {
    btnClearSession.addEventListener('click', async () => {
      const ok = confirm('정말 분석 결과와 불러온 모든 원본 데이터를 초기화(리셋)하시겠습니까?');
      if (!ok) return;

      await store.clearAllData();
      showToast('🔄 모든 분석 결과와 원본 데이터가 깨끗하게 리셋되었습니다. 새로고침합니다.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 350);
    });
  }

  // [핵심 요구사항] 브라우저 F5 새로고침 감지 시 피드백 노트 페이지에도 실시간 새로고침 동기화 신호 전송
  try {
    const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    const isBrowserReload = navEntry ? (navEntry.type === 'reload') : (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
    if (isBrowserReload) {
      store.notifySyncEvent('PAGE_RELOAD', { source: 'dashboard' });
    }
  } catch (e) {
    console.warn('새로고침 상태 감지 예외:', e);
  }

  // [핵심 요구사항] 브라우저 기동 / 새로고침(F5) 시: 저장된 데이터를 복원하여 새로고침 버튼을 누르기 전까지 분석 결과 유지!
  const hasRestoredData = await store.loadSavedState();
  updateAllSlotsUI();

  if (hasRestoredData) {
    const lastMode = localStorage.getItem('cmwork_last_analysis_mode') || 'all';
    try {
      if (lastMode.startsWith('raw_')) {
        const slotKey = lastMode.replace('raw_', '');
        if (store.getVaultData(slotKey)) {
          renderRawSlotView(slotKey);
        } else {
          runAllAnalyses(false);
        }
      } else if (lastMode !== 'all' && registry.get(lastMode)) {
        runSingleAnalysis(lastMode, false);
      } else {
        runAllAnalyses(false);
      }
      showToast('기존 분석 데이터 및 결과가 유지되었습니다. (새로고침 버튼 클릭 시 리셋)', 'info');
    } catch (e) {
      console.warn('초기 분석 복원 오류:', e);
    }
  }

  // [핵심 요구사항] 피드백 노트 등 다른 탭에서 새로고침/리셋 신호 수신 시 메인 대시보드도 즉각 자동 동기화
  if (store.syncChannel) {
    store.syncChannel.onmessage = (event) => {
      const { type, source } = event.data || {};
      if (source !== 'dashboard' && (type === 'RESET_ALL' || type === 'PAGE_RELOAD')) {
        showToast('🔄 연동 페이지에서 새로고침 감지: 대시보드를 즉시 새로고침합니다.', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 350);
      }
    };
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'cmwork_sync_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload.source !== 'dashboard' && (payload.type === 'RESET_ALL' || payload.type === 'PAGE_RELOAD')) {
          showToast('🔄 새로고침 감지: 대시보드를 즉시 새로고침합니다.', 'info');
          setTimeout(() => {
            window.location.reload();
          }, 350);
        }
      } catch (err) {}
    }
  });
});
