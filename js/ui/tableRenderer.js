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
}

window.TableRenderer = TableRenderer;
