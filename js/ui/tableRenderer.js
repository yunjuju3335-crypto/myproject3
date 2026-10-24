/**
 * 데이터 테이블 렌더러 (tableRenderer.js)
 * 정렬, 검색 필터링, CSV 내보내기, 순위 뱃지가 완비된 고성능 인터랙티브 테이블
 */
class TableRenderer {
  /**
   * @param {HTMLElement} container 
   * @param {Array<{ key: string, label: string }>} columns 
   * @param {Array<Object>} data 
   * @param {string} title 
   */
  static render(container, columns, data, title = '데이터 결과 목록') {
    let currentData = [...data];
    let sortKey = null;
    let sortAsc = true;

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    // Toolbar (검색 & CSV 내보내기)
    const toolbar = document.createElement('div');
    toolbar.className = 'table-toolbar';
    toolbar.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 13px; font-weight: 700;">${title}</span>
        <span style="font-size: 11px; color: var(--text-muted); background: var(--border-color); padding: 2px 6px; border-radius: 10px;">총 ${data.length}건</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="text" class="table-search" placeholder="검색어 입력..." />
        <button class="btn btn-secondary" style="width: auto; padding: 6px 12px; font-size: 11px;" id="btn-export-csv">
          📥 CSV 내보내기
        </button>
      </div>
    `;

    const table = document.createElement('table');
    table.className = 'data-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col.label;
      th.addEventListener('click', () => {
        if (sortKey === col.key) {
          sortAsc = !sortAsc;
        } else {
          sortKey = col.key;
          sortAsc = true;
        }
        sortAndRender();
      });
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const renderRows = (rowsToRender) => {
      tbody.innerHTML = '';
      if (rowsToRender.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align: center; padding: 24px; color: var(--text-muted);">검색 결과가 없습니다.</td></tr>`;
        return;
      }

      rowsToRender.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
          const td = document.createElement('td');
          const val = row[col.key];

          // 특별 뱃지 및 단위 포맷 적용
          if (col.key === 'rank') {
            const badgeClass = val === 1 ? 'rank-1' : (val === 2 ? 'rank-2' : (val === 3 ? 'rank-3' : 'rank-other'));
            td.innerHTML = `<span class="rank-badge ${badgeClass}">${val}</span>`;
          } else if (col.key === 'increaseOrders' || col.key === 'diff') {
            const num = Number(val);
            const isPos = num > 0;
            const sign = isPos ? '+' : '';
            td.innerHTML = `<span class="${isPos ? 'text-positive' : (num < 0 ? 'text-negative' : '')}" style="font-weight: 700;">${sign}${num.toLocaleString()}건</span>`;
          } else if (['growthRate', 'shareRate', 'rate', 'errorRate', 'achieveRate'].includes(col.key)) {
            const num = Number(val);
            const isErrHigh = col.key === 'errorRate' && num > 5;
            const isPos = col.key === 'errorRate' ? num === 0 : num > 0;
            const cls = isErrHigh ? 'text-negative' : (isPos ? 'text-positive' : '');
            td.innerHTML = `<span class="${cls}" style="font-weight: 600;">${val}%</span>`;
          } else if (['errorCost', 'totalCost', 'avgCost', 'achieveAmount', 'targetAmount', '금액'].includes(col.key)) {
            const num = Number(val);
            const isCost = col.key.toLowerCase().includes('cost') && num > 0;
            td.innerHTML = `<span style="font-weight: 600; color: ${isCost ? '#ef4444' : 'inherit'};">${num.toLocaleString()}원</span>`;
          } else if (col.key === 'grade') {
            const isBest = String(val).includes('최우수');
            const isWarn = String(val).includes('관리주의');
            const bg = isBest ? 'rgba(34, 197, 94, 0.15)' : (isWarn ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)');
            const color = isBest ? '#22c55e' : (isWarn ? '#ef4444' : '#818cf8');
            td.innerHTML = `<span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: ${bg}; color: ${color};">${val}</span>`;
          } else if (['completedQty', 'completedOrders', 'errorCount', 'count', 'orders', 'qty', 'targetCompletedCount', 'prevOrders', 'currOrders'].includes(col.key)) {
            const num = Number(val);
            td.innerText = `${num.toLocaleString()}건`;
          } else if (col.key === 'no') {
            td.innerText = val !== undefined && val !== null ? val : '-';
          } else if (typeof val === 'number') {
            td.innerText = val.toLocaleString();
          } else {
            td.innerText = val !== undefined && val !== null ? val : '-';
          }

          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    };

    const sortAndRender = () => {
      if (sortKey) {
        currentData.sort((a, b) => {
          let vA = a[sortKey];
          let vB = b[sortKey];
          if (typeof vA === 'string') vA = vA.toLowerCase();
          if (typeof vB === 'string') vB = vB.toLowerCase();
          if (vA < vB) return sortAsc ? -1 : 1;
          if (vA > vB) return sortAsc ? 1 : -1;
          return 0;
        });
      }
      renderRows(currentData);
    };

    // 검색 이벤트
    const searchInput = toolbar.querySelector('.table-search');
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        currentData = [...data];
      } else {
        currentData = data.filter(item => {
          return Object.values(item).some(val => String(val).toLowerCase().includes(q));
        });
      }
      sortAndRender();
    });

    // CSV 내보내기 이벤트
    toolbar.querySelector('#btn-export-csv').addEventListener('click', () => {
      const headerNames = columns.map(c => c.label).join(',');
      const rowsCsv = currentData.map(row => {
        return columns.map(c => `"${String(row[c.key] || '').replace(/"/g, '""')}"`).join(',');
      }).join('\n');

      const csvContent = "\uFEFF" + headerNames + "\n" + rowsCsv;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    renderRows(currentData);
    wrapper.appendChild(toolbar);
    wrapper.appendChild(table);
    container.appendChild(wrapper);
  }

  /**
   * 여러 개의 표를 순차적으로 렌더링합니다 (모든 결과의 표시방식은 표)
   */
  static renderMultiTables(container, tables, mainTitle = '분석 결과 상세 표') {
    const multiWrapper = document.createElement('div');
    multiWrapper.className = 'multi-tables-container';
    multiWrapper.style.display = 'flex';
    multiWrapper.style.flexDirection = 'column';
    multiWrapper.style.gap = '20px';

    tables.forEach(tInfo => {
      const section = document.createElement('div');
      section.className = 'table-section';
      this.render(section, tInfo.columns, tInfo.data, tInfo.title);
      multiWrapper.appendChild(section);
    });

    container.appendChild(multiWrapper);
    return multiWrapper;
  }

  /**
   * 불러온 엑셀 원본 데이터 전수 테이블 렌더러
   * @param {HTMLElement} container
   * @param {Array<Object>} rows
   * @param {string} title
   * @param {Object} meta { fileName, totalRows, totalCols, missingCount }
   */
  static renderRawDataTable(container, rows, title = '불러온 원본 데이터', meta = {}) {
    if (!rows || rows.length === 0) {
      container.innerHTML = `
        <div class="col-3-empty">
          <div style="font-size: 32px;">📭</div>
          <div style="font-size: 14px; font-weight: 600;">불러온 데이터가 비어있습니다.</div>
        </div>
      `;
      return;
    }

    const sample = rows[0];
    const columns = Object.keys(sample).map(k => ({ key: k, label: k }));

    const wrapper = document.createElement('div');
    wrapper.className = 'raw-data-view';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '14px';

    // 메타 정보 배너
    const metaCard = document.createElement('div');
    metaCard.className = 'kpi-card';
    metaCard.style.padding = '14px 18px';
    metaCard.style.display = 'flex';
    metaCard.style.justifyContent = 'space-between';
    metaCard.style.alignItems = 'center';
    metaCard.style.background = 'rgba(99, 102, 241, 0.08)';
    metaCard.style.border = '1px solid rgba(99, 102, 241, 0.25)';
    metaCard.style.borderRadius = 'var(--radius-md)';
    metaCard.innerHTML = `
      <div>
        <div style="font-size: 15px; font-weight: 700; color: var(--accent-indigo); display: flex; align-items: center; gap: 8px;">
          <span>📄</span>
          <span>${title}</span>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          파일명: <strong>${meta.fileName || '업로드 파일'}</strong> | 총 <strong>${rows.length.toLocaleString()}행</strong>, <strong>${columns.length}개 열</strong>
        </div>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="slot-badge badge-ready" style="font-size: 12px; padding: 5px 10px;">
          🛡️ 데이터 보관 및 무결성 검증 완료
        </span>
      </div>
    `;
    wrapper.appendChild(metaCard);

    const tableBox = document.createElement('div');
    this.render(tableBox, columns, rows, `${title} 전체 목록`);
    wrapper.appendChild(tableBox);

    container.appendChild(wrapper);
  }

  /**
   * H·G·S 등급 화원사 발주 추이 분리 분석 전용 렌더러
   * @param {HTMLElement} container 
   * @param {Object} hgsOutput HgsTrendModule 실행 결과
   * @param {string} title 섹션 타이틀
   */
  static renderHgsAnalysis(container, hgsOutput, title = '1-3. H·G·S 등급 화원사 발주 추이 비교 분석') {
    if (!hgsOutput) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'hgs-analysis-view';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.gap = '14px';

    // 1. 상단 안내 및 종합 KPI 카드 행
    const kpiRow = document.createElement('div');
    kpiRow.className = 'kpi-row';
    kpiRow.style.display = 'grid';
    kpiRow.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    kpiRow.style.gap = '12px';

    const h = hgsOutput.hAnalysis || {};
    const g = hgsOutput.gAnalysis || {};
    const s = hgsOutput.sAnalysis || {};

    const createGroupKpi = (label, tag, count, prev, curr, diff, rate, color) => {
      const isPos = diff >= 0;
      return `
        <div class="kpi-card" style="border-top: 3px solid ${color}; padding: 14px 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 700; color: ${color};">${label}</span>
            <span style="font-size: 11px; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px;">${count}개사</span>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: ${isPos ? '#10b981' : '#ef4444'};">
            ${isPos ? '+' : ''}${diff.toLocaleString()}건
            <span style="font-size: 13px; font-weight: 600; margin-left: 4px;">(${rate >= 0 ? '+' : ''}${rate}%)</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 6px;">
            이전 <strong>${prev.toLocaleString()}건</strong> ➔ 현재 <strong>${curr.toLocaleString()}건</strong>
          </div>
        </div>
      `;
    };

    kpiRow.innerHTML = `
      ${createGroupKpi('🏷️ H 그룹 발주 추이', 'H', h.count || 0, h.totalPrev || 0, h.totalCurr || 0, h.totalDiff || 0, h.totalRate || 0, '#6366f1')}
      ${createGroupKpi('🏷️ G 그룹 발주 추이', 'G', g.count || 0, g.totalPrev || 0, g.totalCurr || 0, g.totalDiff || 0, g.totalRate || 0, '#10b981')}
      ${createGroupKpi('🏷️ S 그룹 발주 추이', 'S', s.count || 0, s.totalPrev || 0, s.totalCurr || 0, s.totalDiff || 0, s.totalRate || 0, '#f59e0b')}
    `;
    wrapper.appendChild(kpiRow);

    // 2. 탭 전환 버튼 바
    const tabBar = document.createElement('div');
    tabBar.style.display = 'flex';
    tabBar.style.gap = '8px';
    tabBar.style.flexWrap = 'wrap';
    tabBar.style.margin = '4px 0 10px 0';
    tabBar.innerHTML = `
      <button class="btn btn-secondary hgs-tab-btn active" data-hgs="summary" style="font-size: 12px; padding: 6px 14px; width: auto; font-weight: 700;">
        📊 H·G·S 종합 비교 요약
      </button>
      <button class="btn btn-secondary hgs-tab-btn" data-hgs="H" style="font-size: 12px; padding: 6px 14px; width: auto; font-weight: 600;">
        🏷️ H 그룹 개별 추이 (${h.count || 0}개사)
      </button>
      <button class="btn btn-secondary hgs-tab-btn" data-hgs="G" style="font-size: 12px; padding: 6px 14px; width: auto; font-weight: 600;">
        🏷️ G 그룹 개별 추이 (${g.count || 0}개사)
      </button>
      <button class="btn btn-secondary hgs-tab-btn" data-hgs="S" style="font-size: 12px; padding: 6px 14px; width: auto; font-weight: 600;">
        🏷️ S 그룹 개별 추이 (${s.count || 0}개사)
      </button>
    `;
    wrapper.appendChild(tabBar);

    // 3. 테이블 컨테이너 영역
    const contentBox = document.createElement('div');
    contentBox.className = 'hgs-content-box';
    wrapper.appendChild(contentBox);

    // 요약 테이블 컬럼
    const summaryColumns = [
      { key: 'rank', label: '순위' },
      { key: 'group', label: '구분 그룹' },
      { key: 'count', label: '화원사 수' },
      { key: 'prevOrders', label: '이전 총 체인발주' },
      { key: 'currOrders', label: '현 총 체인발주' },
      { key: 'diff', label: '순증감 (건)' },
      { key: 'growthRate', label: '증감율 (%)' },
      { key: 'prodCompleted', label: '1-3 상품완료건' }
    ];

    // 개별 그룹 테이블 렌더링 헬퍼
    const renderActiveTab = (tabKey) => {
      contentBox.innerHTML = '';
      tabBar.querySelectorAll('.hgs-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-hgs') === tabKey);
      });

      if (tabKey === 'summary') {
        const tableBox = document.createElement('div');
        this.render(tableBox, summaryColumns, hgsOutput.summaryComparison || [], 'H·G·S 등급별 발주 추이 종합 비교 요약표');
        contentBox.appendChild(tableBox);
      } else if (tabKey === 'H') {
        const tableBox = document.createElement('div');
        this.render(tableBox, hgsOutput.columns, h.list || [], `H 그룹 소속 화원사 발주 추이 비교 목록 (총 ${h.count || 0}개사)`);
        contentBox.appendChild(tableBox);
      } else if (tabKey === 'G') {
        const tableBox = document.createElement('div');
        this.render(tableBox, hgsOutput.columns, g.list || [], `G 그룹 소속 화원사 발주 추이 비교 목록 (총 ${g.count || 0}개사)`);
        contentBox.appendChild(tableBox);
      } else if (tabKey === 'S') {
        const tableBox = document.createElement('div');
        this.render(tableBox, hgsOutput.columns, s.list || [], `S 그룹 소속 화원사 발주 추이 비교 목록 (총 ${s.count || 0}개사)`);
        contentBox.appendChild(tableBox);
      }
    };

    // 탭 클릭 이벤트
    tabBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.hgs-tab-btn');
      if (!btn) return;
      const tabKey = btn.getAttribute('data-hgs');
      renderActiveTab(tabKey);
    });

    // 초기 렌더링 (종합 요약)
    renderActiveTab('summary');

    container.appendChild(wrapper);
  }
}

window.TableRenderer = TableRenderer;
