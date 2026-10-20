/**
 * 분석 모듈 2: 증가 화원사 1위~10위 추출 (floristRanking.js)
 * 기준: 발주 건수 순증가량
 * 요구사항: 표(Table)와 그래프(Chart) 2가지 모두 동시 렌더링!
 * 필터링: (보류), (정지), (해지) 화원사 전수 제외!
 */
const FloristRankingModule = {
  id: 'topFlorists',
  name: '1-2. 발주증가 화원사 1위~10위 추출 (화원사의 체인발주 수량)',
  description: '화원사의 체인발주 수량 기준 전월 대비 발주증가 수량(당월-전월)이 가장 큰 상위 1위~10위 화원사를 표와 그래프로 시각화합니다. ((보류), (정지), (해지) 제외)',
  icon: '🏆',

  isExcluded(name) {
    if (!name) return true;
    const str = String(name).trim();
    if (!str || str.toLowerCase() === 'nan') return true;
    const cleanNoSpace = str.replace(/\s+/g, '').toLowerCase();
    if (['합계', '총계', '소계', '평균', 'total', 'subtotal'].includes(cleanNoSpace)) return true;

    const regex = /[\(\[\<]\s*[^)\]>]*?(to\s*없음|보류중|보류|연락두절|정지\.발주사|정지중|정지전불|정지|탈퇴폐업|탈퇴|폐업|테스트|해지)/i;
    if (regex.test(str)) return true;
    if (/(테스트|폐업\/|정지\/|해지\/|보류\/|^to\s*없음)/i.test(str)) return true;

    const explicit = [
      "(to없음)", "(to 없음)", "(보류중)", "(보류)",
      "(연락두절)", "(정지)", "(정지.발주사)", "(정지중)",
      "(정지전불", "(정지전불)", "(탈퇴)", "(폐업)",
      "(탈퇴폐업)", "(테스트)", "(해지", "(해지)"
    ];
    const lower = str.toLowerCase();
    return explicit.some(t => lower.includes(t.toLowerCase()));
  },

  isPureNumber(val) {
    if (val === null || val === undefined) return false;
    const s = String(val).trim();
    if (!s) return false;
    return /^[+-]?[\d,]+(\.\d+)?$/.test(s);
  },

  isColumnNumeric(rows, colKey) {
    if (!rows || !colKey) return true;
    let nonEmpty = 0;
    let numCount = 0;
    for (let i = 0; i < rows.length && nonEmpty < 50; i++) {
      const v = rows[i][colKey];
      if (v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim().toLowerCase() !== 'nan') {
        nonEmpty++;
        if (this.isPureNumber(v)) numCount++;
      }
    }
    return nonEmpty === 0 || (numCount / nonEmpty) >= 0.5;
  },

  normalizeRows(rows) {
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    const hasEmptyKeys = keys.some(k => k.startsWith('__EMPTY') || k.startsWith('Unnamed'));
    if (!hasEmptyKeys) return rows;

    const headerKeywords = ['화원사명', '화원별칭', '농장', '상품명', '체인발주', '발주수량', '접수자', '실수자'];
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      const vals = keys.map(k => String(rows[i][k] || '').trim());
      if (vals.some(v => headerKeywords.some(hk => v.includes(hk)))) {
        const newHeaderMap = {};
        keys.forEach((k, idx) => {
          newHeaderMap[k] = vals[idx] || `컬럼_${idx + 1}`;
        });
        return rows.slice(i + 1).map(r => {
          const obj = {};
          keys.forEach(k => {
            obj[newHeaderMap[k]] = r[k];
          });
          return obj;
        });
      }
    }
    return rows;
  },

  findNameColumn(rows, keys) {
    const excludedTokens = ['번호', '코드', 'id', 'no.', '구분', '일련', '배송비', '배송료', '옵션', '수량', '건수', '금액', '가격', '단가', '수수료', '발주율', '진행률', '달성률', '비율', '받는분', '연락처', '전화', '일시', '일자', '요청일', '수정일', '지역', '시군구', '주소', '별칭'];
    const isExcludedKey = (k) => {
      const clean = k.replace(/\s+/g, '').toLowerCase();
      return excludedTokens.some(ex => clean.includes(ex));
    };

    const exactTargets = ['화원사명', '농장', '농장명', '화원명', '담당화원사', '수주화원사명', '수주화원사', '발주화원사', '화원사', '상호명', '상호', '업체명'];
    for (const target of exactTargets) {
      const found = keys.find(k => k.replace(/\s+/g, '') === target && !isExcludedKey(k) && !this.isColumnNumeric(rows, k));
      if (found) return found;
    }

    const partialTargets = ['화원사명', '농장', '화원명', '담당화원사', '화원사', '화원', '상호', '업체', '가맹점'];
    for (const target of partialTargets) {
      const found = keys.find(k => k.replace(/\s+/g, '').includes(target) && !isExcludedKey(k) && !this.isColumnNumeric(rows, k));
      if (found) return found;
    }

    return keys.find(k => !isExcludedKey(k) && !this.isColumnNumeric(rows, k)) || keys[0];
  },

  findQtyColumn(keys) {
    const isBadQtyCol = (k) => {
      const c = k.replace(/\s+/g, '').toLowerCase();
      return ['수주', '직발', '수수료', '발주율', '비율', '금액', '단가', '가격', '번호', '코드'].some(ex => c.includes(ex));
    };
    const targets = ['체인발주수량', '체인발주건수', '체인발주', '발주수량', '발주건수', '주문수량', '수량', '건수'];
    for (const target of targets) {
      const found = keys.find(k => k.replace(/\s+/g, '').includes(target) && !isBadQtyCol(k));
      if (found) return found;
    }
    return null;
  },

  parseOrderQty(row, qtyKey) {
    if (!qtyKey) return 1;
    const rawVal = row[qtyKey];
    if (rawVal === null || rawVal === undefined) return 0;
    const str = String(rawVal).replace(/,/g, '').trim();
    if (!str || str === '-' || str.toLowerCase() === 'nan') return 0;
    const num = Number(str);
    return Number.isFinite(num) && num > 0 ? Math.round(num) : 0;
  },

  buildNumberToNameMap(extraRowSets = []) {
    const map = {};
    const store = typeof window !== 'undefined' ? window.appStore : null;
    const allSets = [...extraRowSets];
    if (store && store.state && store.state.vault) {
      ['prevOrders', 'currOrders', 'products', 'receptions'].forEach(slot => {
        if (store.state.vault[slot]?.rows) allSets.push(store.state.vault[slot].rows);
      });
    }

    allSets.forEach(rawSet => {
      const rows = this.normalizeRows(rawSet);
      if (!rows || rows.length === 0) return;
      const keys = Object.keys(rows[0]);
      const nameCol = this.findNameColumn(rows, keys);
      const numCols = keys.filter(k => ['농장번호', '화원사번호', '번호', '구분', 'no.', '코드'].some(t => k.replace(/\s+/g, '').toLowerCase().includes(t)));

      rows.forEach(r => {
        const nameVal = (nameCol && r[nameCol] && !this.isPureNumber(r[nameCol]))
          ? String(r[nameCol]).trim()
          : '';
        if (!nameVal || nameVal.toLowerCase() === 'nan') return;
        numCols.forEach(nc => {
          const nv = String(r[nc] ?? '').trim();
          if (nv && this.isPureNumber(nv)) {
            map[nv] = nameVal;
          }
        });
      });
    });

    return map;
  },

  // 원본자료의 화원사명(또는 농장) 이름을 그대로 유지하되, '~호' 뒤에 붙은 기호는 무시(제거)
  normalizeFloristName(name) {
    if (!name) return '';
    const str = String(name).trim();
    return str.replace(/(\d+호(?:\s*[가-힣]+)?)[^가-힣]*$/, '$1').trim();
  },

  execute(prevRows, currRows, topN = 10) {
    if (!prevRows || !currRows) {
      throw new Error("전월 발주 데이터와 당월 발주 데이터가 모두 필요합니다.");
    }

    const normPrev = this.normalizeRows(prevRows);
    const normCurr = this.normalizeRows(currRows);
    const numToNameMap = this.buildNumberToNameMap([normPrev, normCurr]);

    const extractEntries = (rows) => {
      if (!rows || rows.length === 0) return [];
      const keys = Object.keys(rows[0]);
      const codeKey = this.findNameColumn(rows, keys);
      const qtyKey = this.findQtyColumn(keys);

      return rows.map(r => {
        let rawName = String(r[codeKey] ?? '').trim();

        if (!rawName || this.isPureNumber(rawName)) {
          if (rawName && numToNameMap[rawName]) {
            rawName = numToNameMap[rawName];
          } else {
            return null;
          }
        }

        // 원본자료의 화원사명(또는 농장) 이름을 그대로 사용하되, ~호 뒤에 붙은 기호는 무시
        const displayName = this.normalizeFloristName(rawName);
        const excluded = !displayName || this.isExcluded(rawName) || this.isExcluded(displayName);
        const qty = this.parseOrderQty(r, qtyKey);

        return { displayName, excluded, qty };
      }).filter(Boolean);
    };

    const prevEntries = extractEntries(normPrev);
    const currEntries = extractEntries(normCurr);

    const excludedNames = new Set();
    prevEntries.forEach(e => {
      if (e.excluded) excludedNames.add(e.displayName);
    });
    currEntries.forEach(e => {
      if (e.excluded) excludedNames.add(e.displayName);
    });

    const prevCounts = {};
    prevEntries.forEach(e => {
      if (e.excluded || excludedNames.has(e.displayName)) return;
      if (e.qty > 0) {
        prevCounts[e.displayName] = (prevCounts[e.displayName] || 0) + e.qty;
      }
    });

    const currCounts = {};
    currEntries.forEach(e => {
      if (e.excluded || excludedNames.has(e.displayName)) return;
      if (e.qty > 0) {
        currCounts[e.displayName] = (currCounts[e.displayName] || 0) + e.qty;
      }
    });

    const allFlorists = Array.from(new Set([...Object.keys(prevCounts), ...Object.keys(currCounts)]))
      .filter(fl => (prevCounts[fl] || 0) > 0 || (currCounts[fl] || 0) > 0);

    const rankingList = [];

    allFlorists.forEach(fl => {
      const p = prevCounts[fl] || 0;
      const c = currCounts[fl] || 0;
      const inc = c - p;
      if (inc <= 0) return;

      const rate = p > 0 ? Number(((inc / p) * 100).toFixed(1)) : 100.0;

      rankingList.push({
        floristName: fl,
        prevOrders: p,
        currOrders: c,
        increaseOrders: inc,
        growthRate: rate
      });
    });

    rankingList.sort((a, b) =>
      (b.increaseOrders - a.increaseOrders) ||
      (b.currOrders - a.currOrders) ||
      (b.growthRate - a.growthRate) ||
      a.floristName.localeCompare(b.floristName, 'ko')
    );

    const topData = rankingList.slice(0, topN).map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    const totalIncreaseInTop10 = topData.reduce((acc, cur) => acc + cur.increaseOrders, 0);

    return {
      type: 'table_and_chart', // 표와 그래프 둘 다 표시
      title: '1-2. 발주증가 화원사 1위~10위 추출 (화원사의 체인발주 수량)',
      kpis: [
        { label: '발주증가 1위 화원사', value: topData[0]?.floristName || '-', sub: `전월 ${topData[0]?.prevOrders || 0}건 → 당월 ${topData[0]?.currOrders || 0}건 (+${topData[0]?.increaseOrders || 0}건)` },
        { label: 'TOP 10 총 발주증가량', value: `+${totalIncreaseInTop10.toLocaleString()}건`, isPositive: true, sub: '체인발주 순증가 1~10위 합산' },
        { label: '발주증가 / 활동 화원사', value: `${rankingList.length}개사 / ${allFlorists.length}개사`, sub: '체인발주 증가 화원사 비중' }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'floristName', label: '화원사명' },
        { key: 'prevOrders', label: '이전달 체인발주 수량' },
        { key: 'currOrders', label: '현재달 체인발주 수량' },
        { key: 'increaseOrders', label: '발주증가 수량 (건)' },
        { key: 'growthRate', label: '증가율 (%)' }
      ],
      tableData: topData,
      chartData: {
        labels: topData.map(d => d.floristName),
        datasets: [
          {
            label: '발주증가 수량 (당월-전월)',
            data: topData.map(d => d.increaseOrders),
            backgroundColor: 'rgba(16, 185, 129, 0.88)',
            borderColor: 'rgba(5, 150, 105, 1.0)',
            borderWidth: 1.5
          },
          {
            label: '이전달 체인발주 수량',
            data: topData.map(d => d.prevOrders),
            backgroundColor: 'rgba(148, 163, 184, 0.7)',
            borderColor: 'rgba(148, 163, 184, 1.0)',
            borderWidth: 1
          },
          {
            label: '현재달 체인발주 수량',
            data: topData.map(d => d.currOrders),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgba(37, 99, 235, 1.0)',
            borderWidth: 1
          }
        ]
      }
    };
  }
};

window.FloristRankingModule = FloristRankingModule;
