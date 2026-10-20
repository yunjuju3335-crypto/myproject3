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
  const perfDropzone = document.getElementById('dropzone-performances');
  const perfFileInput = document.getElementById('input-performances');

  const btnSaveOrders = document.getElementById('btn-save-orders');
  const btnSaveProducts = document.getElementById('btn-save-products');
  const btnSaveReceptions = document.getElementById('btn-save-receptions');
  const btnSaveErrors = document.getElementById('btn-save-errors');
  const btnSavePerformances = document.getElementById('btn-save-performances');

  // Action Cards (Col 2)
  const actionList = document.getElementById('analysis-action-list');

  // Result Pane (Col 3)
  const resultContainer = document.getElementById('result-column-body');
  const viewTabs = document.getElementById('view-tabs');

  // 슬롯 메타데이터 정의
  const slotMetaMap = {
    prevOrders: { name: '전월 발주 엑셀', badgeId: 'badge-prev-orders', labelId: 'label-prev-orders' },
    currOrders: { name: '당월 발주 엑셀', badgeId: 'badge-curr-orders', labelId: 'label-curr-orders' },
    products: { name: '2. 상품 진행 엑셀', badgeId: 'badge-products', labelId: 'label-products' },
    receptions: { name: '3. 접수 엑셀', badgeId: 'badge-receptions', labelId: 'label-receptions' },
    errors: { name: '4. 오류 엑셀', badgeId: 'badge-errors', labelId: 'label-errors' },
    performances: { name: '5. 실적 엑셀', badgeId: 'badge-performances', labelId: 'label-performances' }
  };

  // 슬롯별 UI 갱신 함수
  const updateSlotUI = (slotKey) => {
    const meta = slotMetaMap[slotKey];
    if (!meta) return;
    const slot = store.getVaultData(slotKey);
    const badge = document.getElementById(meta.badgeId);
    const label = document.getElementById(meta.labelId);
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
    } else {
      label.innerText = '📂 클릭하여 파일 불러오기 또는 드롭 (.xlsx)';
      badge.innerText = '대기중';
      badge.className = 'slot-badge badge-empty';
    }
  };

  // 저장 버튼들 UI 상태 일괄 갱신
  const updateSaveButtonsUI = () => {
    const prev = store.getVaultData('prevOrders');
    const curr = store.getVaultData('currOrders');
    const prod = store.getVaultData('products');
    const rec = store.getVaultData('receptions');
    const err = store.getVaultData('errors');
    const perf = store.getVaultData('performances');

    if (btnSaveOrders) {
      if (prev && curr) {
        btnSaveOrders.innerText = '✅ 1. 발주 데이터 로드 완료 (DB 미저장)';
        btnSaveOrders.className = 'btn btn-primary';
      } else if (prev || curr) {
        btnSaveOrders.innerText = '📂 1. 발주 데이터 (나머지 파일 필요)';
        btnSaveOrders.className = 'btn btn-secondary';
      } else {
        btnSaveOrders.innerText = '📊 1. 발주 원본데이터 분석 실행';
        btnSaveOrders.className = 'btn btn-secondary';
      }
    }

    if (btnSaveProducts) {
      btnSaveProducts.innerText = prod ? '✅ 2. 상품 진행 로드 완료 (DB 미저장)' : '📊 2. 상품 진행 원본데이터 확인';
      btnSaveProducts.className = prod ? 'btn btn-primary' : 'btn btn-secondary';
    }

    if (btnSaveReceptions) {
      btnSaveReceptions.innerText = rec ? '✅ 3. 접수 데이터 로드 완료 (DB 미저장)' : '📊 3. 접수 원본데이터 확인';
      btnSaveReceptions.className = rec ? 'btn btn-primary' : 'btn btn-secondary';
    }

    if (btnSaveErrors) {
      btnSaveErrors.innerText = err ? '✅ 4. 오류 데이터 로드 완료 (DB 미저장)' : '📊 4. 오류 원본데이터 확인';
      btnSaveErrors.className = err ? 'btn btn-primary' : 'btn btn-secondary';
    }

    if (btnSavePerformances) {
      btnSavePerformances.innerText = perf ? '✅ 5. 실적 데이터 로드 완료 (DB 미저장)' : '📊 5. 실적 원본데이터 확인';
      btnSavePerformances.className = perf ? 'btn btn-primary' : 'btn btn-secondary';
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
    } else if (slotKey === 'performances' && window.StaffSummaryModule) {
      try {
        const recData = store.getVaultData('receptions');
        const errData = store.getVaultData('errors');
        const out = window.StaffSummaryModule.execute(recData?.rows, errData?.rows, slotData.rows);
        const subBox = document.createElement('div');
        subBox.style.marginTop = '28px';
        subBox.style.borderTop = '2px dashed #8b5cf6';
        subBox.style.paddingTop = '20px';
        subBox.innerHTML = `<h3 style="font-size: 16px; font-weight: 800; margin-bottom: 12px; color: #8b5cf6;">🎯 [연관 분석 결과] 접수자 개인별 종합 집계표</h3>`;
        window.TableRenderer.render(subBox, out.columns, out.data, out.title);
        container.appendChild(subBox);
      } catch (e) {
        console.warn('연관 실적 분석 렌더링 생략:', e);
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

  // 6개 슬롯 드롭존 이벤트 연결
  setupDropzone(prevDropzone, prevFileInput, (file) => processSlotFile(file, 'prevOrders', 'badge-prev-orders', 'label-prev-orders'));
  setupDropzone(currDropzone, currFileInput, (file) => processSlotFile(file, 'currOrders', 'badge-curr-orders', 'label-curr-orders'));
  setupDropzone(prodDropzone, prodFileInput, (file) => processSlotFile(file, 'products', 'badge-products', 'label-products'));
  setupDropzone(recDropzone, recFileInput, (file) => processSlotFile(file, 'receptions', 'badge-receptions', 'label-receptions'));
  setupDropzone(errDropzone, errFileInput, (file) => processSlotFile(file, 'errors', 'badge-errors', 'label-errors'));
  setupDropzone(perfDropzone, perfFileInput, (file) => processSlotFile(file, 'performances', 'badge-performances', 'label-performances'));

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

      showToast('📊 1. 발주 원본데이터 전체 분석을 실행합니다. (DB 저장 안 함)', 'success');
      runAllAnalyses(true);
    });
  }

  // 2. 상품 진행 원본데이터 확인 버튼
  if (btnSaveProducts) {
    btnSaveProducts.addEventListener('click', () => {
      const prod = store.getVaultData('products');
      if (!prod) {
        prodFileInput.click();
        return;
      }
      showToast('📊 2. 상품 진행 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('products');
    });
  }

  // 3. 접수 원본데이터 확인 버튼
  if (btnSaveReceptions) {
    btnSaveReceptions.addEventListener('click', () => {
      const rec = store.getVaultData('receptions');
      if (!rec) {
        recFileInput.click();
        return;
      }
      showToast('📊 3. 접수 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('receptions');
    });
  }

  // 4. 오류 원본데이터 확인 버튼
  if (btnSaveErrors) {
    btnSaveErrors.addEventListener('click', () => {
      const errData = store.getVaultData('errors');
      if (!errData) {
        errFileInput.click();
        return;
      }
      showToast('📊 4. 오류 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('errors');
    });
  }

  // 5. 실적 원본데이터 확인 버튼
  if (btnSavePerformances) {
    btnSavePerformances.addEventListener('click', () => {
      const perfData = store.getVaultData('performances');
      if (!perfData) {
        perfFileInput.click();
        return;
      }
      showToast('📊 5. 실적 원본데이터를 표시합니다. (DB 저장 안 함)', 'success');
      renderRawSlotView('performances');
    });
  }

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
    const perf = store.getVaultData('performances');

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

    // 만약 발주 파일이 없더라도 다른 데이터(접수, 오류 등)가 있으면 그것들을 보여줌
    if (!prev && !curr && !prod && !rec && !err && !perf) {
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

    // 1-1. 발주 추이 표
    if (trendOutput) {
      const section1 = document.createElement('div');
      section1.style.marginTop = '20px';
      section1.innerHTML = `
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-indigo);">📦 [결과 1-1]</span>
          <span>화원사 기준 이전달 대비 현재달 발주 추이 변화표</span>
        </div>
      `;
      const tableBox1 = document.createElement('div');
      window.TableRenderer.render(tableBox1, trendOutput.columns, trendOutput.data, '화원사별 전월 대비 발주 추이 비교');
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
          <span>1-2. 발주증가 화원사 1위~10위 추출 (화원사의 체인발주 수량)</span>
        </div>
      `;
      const tableBox2 = document.createElement('div');
      window.TableRenderer.render(tableBox2, floristOutput.columns, floristOutput.tableData, '1-2. 발주증가 화원사 1위~10위 추출 (화원사의 체인발주 수량)');
      section2.appendChild(tableBox2);

      const chartBox = document.createElement('div');
      section2.appendChild(chartBox);
      window.ChartRenderer.render(chartBox, floristOutput.chartData, '1-2. 발주증가 화원사 1위~10위 시각화 (화원사의 체인발주 수량 순증가 기준)');

      container.appendChild(section2);
    }

    // 2. 상품 진행 분석 표
    if (prodOutput) {
      const section3 = document.createElement('div');
      section3.style.marginTop = '28px';
      section3.innerHTML = `
        <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <span style="color: var(--accent-emerald);">🚚 [결과 2]</span>
          <span>농장별 특정 상품 완료 건수 집계표 (특·특대·4단·5단·짱구 완료건, 0건 제외)</span>
        </div>
      `;
      const tableBox3 = document.createElement('div');
      window.TableRenderer.render(tableBox3, prodOutput.columns, prodOutput.data, prodOutput.title);
      section3.appendChild(tableBox3);
      container.appendChild(section3);
    }

    // 3. 현재 달의 접수 수량 표
    const recVault = store.getVaultData('receptions');
    if (recVault && recVault.rows && window.ReceptionCountModule) {
      try {
        const recOutput = window.ReceptionCountModule.execute(recVault.rows);
        const section4 = document.createElement('div');
        section4.style.marginTop = '28px';
        section4.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--accent-indigo);">📋 [결과 3]</span>
            <span>현재 달의 접수 수량 (기준: 접수자, 배송일, 완료)</span>
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

    // 4. 현재 달의 오류 표
    const errVault = store.getVaultData('errors');
    if (errVault && errVault.rows && window.ErrorAnalysisModule) {
      try {
        const errOutput = window.ErrorAnalysisModule.execute(errVault.rows);
        const section5 = document.createElement('div');
        section5.style.marginTop = '28px';
        section5.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="color: #ef4444;">⚠️ [결과 4]</span>
            <span>현재 달의 오류 (기준: 실수자, 처리일시, 실수금액, 실수유형)</span>
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

    // 5. 접수자 개인별 집계 표
    const perfVault = store.getVaultData('performances');
    if (window.StaffSummaryModule && ((recVault && recVault.rows) || (errVault && errVault.rows))) {
      try {
        const staffOutput = window.StaffSummaryModule.execute(recVault?.rows, errVault?.rows, perfVault?.rows);
        const section6 = document.createElement('div');
        section6.style.marginTop = '28px';
        section6.innerHTML = `
          <div style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="color: #8b5cf6;">👤 [결과 5]</span>
            <span>접수자 개인별 집계 (분석결과 3.4를 개인별로 정리)</span>
          </div>
        `;
        const tableBox6 = document.createElement('div');
        window.TableRenderer.render(tableBox6, staffOutput.columns, staffOutput.data, staffOutput.title);
        section6.appendChild(tableBox6);
        container.appendChild(section6);
      } catch (e) {
        console.warn('개인별 집계 실패:', e);
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
      const rec = store.getVaultData('receptions') || store.getVaultData('products');
      const errData = store.getVaultData('errors');
      const perf = store.getVaultData('performances');
      if (!rec && !errData) {
        recFileInput.click();
        return;
      }
      output = module.execute(rec ? rec.rows : null, errData ? errData.rows : null, perf ? perf.rows : null);
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

    if (output.type === 'multi_tables') {
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
      <div class="card-desc">1-1번(발주 추이 표), 1-2번(화원사 1~10위 표+그래프), 2번(농장 완료건), 3번(접수 수량), 4번(오류), 5번(개인별 집계)을 한 화면에 모두 펼쳐서 분석합니다.</div>
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
      const loadRemoteExcel = async (url, fileName) => {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      };

      const [prevFile, currFile, prodFile, recFile, errFile, perfFile] = await Promise.all([
        loadRemoteExcel('./data/sample_prev_orders.xlsx', 'sample_prev_orders.xlsx'),
        loadRemoteExcel('./data/sample_curr_orders.xlsx', 'sample_curr_orders.xlsx'),
        loadRemoteExcel('./data/sample_products.xlsx', 'sample_products.xlsx'),
        loadRemoteExcel('./data/sample_receipts.xlsx', 'sample_receipts.xlsx'),
        loadRemoteExcel('./data/sample_errors.xlsx', 'sample_errors.xlsx'),
        loadRemoteExcel('./data/sample_performances.xlsx', 'sample_performances.xlsx')
      ]);

      await processSlotFile(prevFile, 'prevOrders', 'badge-prev-orders', 'label-prev-orders');
      await processSlotFile(currFile, 'currOrders', 'badge-curr-orders', 'label-curr-orders');
      await processSlotFile(prodFile, 'products', 'badge-products', 'label-products');
      await processSlotFile(recFile, 'receptions', 'badge-receptions', 'label-receptions');
      await processSlotFile(errFile, 'errors', 'badge-errors', 'label-errors');
      await processSlotFile(perfFile, 'performances', 'badge-performances', 'label-performances');

      btnLoadSamples.innerText = '⚡ 샘플 데이터 원클릭 로드';
      showToast('전체 6종 샘플 데이터 로드 완료! (DB 저장 안 함)', 'success');
      runAllAnalyses(true);
    } catch (err) {
      console.error(err);
      alert('샘플 파일 로드 실패: ' + err.message);
      btnLoadSamples.innerText = '⚡ 샘플 데이터 원클릭 로드';
    }
  });

  // 웹사이트 주소(URL) 원클릭 복사 버튼
  const btnCopyShareUrl = document.getElementById('btn-copy-share-url');
  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', async () => {
      const shareUrl = window.location.href;
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('웹사이트 주소가 복사되었습니다! 메신저에 붙여넣어 팀원에게 공유하세요.', 'success');
      } catch (e) {
        prompt('아래 웹사이트 주소를 복사하여 팀원에게 공유하세요:', shareUrl);
      }
    });
  }

  // 화면(세션 메모리) 즉시 초기화 버튼
  const btnClearSession = document.getElementById('btn-clear-session');
  if (btnClearSession) {
    btnClearSession.addEventListener('click', async () => {
      ['prevOrders', 'currOrders', 'products', 'receptions', 'errors', 'performances'].forEach(slot => {
        store.state.vault[slot] = null;
      });
      store.state.analysisResults = {};
      store.state.currentAnalysis = null;
      await store.loadSavedState();
      updateAllSlotsUI();
      resultContainer.innerHTML = `
        <div class="col-3-empty">
          <div style="font-size: 36px;">🔒</div>
          <div style="font-size: 15px; font-weight: 700;">화면 데이터가 모두 초기화되었습니다 (DB 미저장)</div>
          <div style="font-size: 12px; max-width: 320px; line-height: 1.5;">
            [칼럼 1]에서 새로운 엑셀 파일을 불러오면 서버나 DB에 저장되지 않고 브라우저 메모리에서만 즉시 분석됩니다.
          </div>
        </div>
      `;
      showToast('현재 세션의 모든 데이터가 메모리에서 안전하게 초기화되었습니다.', 'success');
    });
  }

  // [핵심] 브라우저 기동 시 기존 DB 잔여 데이터를 비우고 깨끗한 초기 상태로 시작
  await store.loadSavedState();
  updateAllSlotsUI();
});
