/**
 * 분석 모듈 1: 화원사별 이전달 대비 현재달 발주 추이 변화 산출 (orderTrend.js)
 * 기준: 화원사 (Florist-Centric) & 발주 건수
 * 필터링: (보류), (정지), (해지) 화원사 전수 제외!
 */
const OrderTrendModule = {
  id: 'orderTrend',
  name: '1-1. 화원사 발주(이전) 대비 1-2. 화원사 발주(현재) 추이 변화',
  description: '1-1. 화원사 발주(이전) 대비 1-2. 화원사 발주(현재) 체인발주 수량 추이를 전수 비교 분석합니다. ((해지), (보류), (정지), (탈퇴), (폐업), (to없음) 제외)',
  icon: '📈',

  isExcluded(name, alias = '') {
    const combined = (String(name || '') + ' ' + String(alias || '')).trim();
    if (!combined || combined.toLowerCase() === 'nan') return true;

    // 공백 제거 및 소문자 정규화
    const cleanNoSpace = combined.replace(/\s+/g, '').toLowerCase();

    // 1. 합계, 총계 등 요약행 필터링
    if (['합계', '총계', '소계', '평균', 'total', 'subtotal'].some(t => cleanNoSpace.includes(t))) {
      return true;
    }

    // 2. 사용자가 지정한 제외 키워드: 보류, 정지, 해지, TO없음, to없음, 탈퇴, 폐업, 폐업해지 등
    // 괄호 유무, 위치, 대소문자 무관하게 화원사명 또는 화원별칭에 단어가 들어있으면 전수 제외!
    const excludeKeywords = [
      '보류',
      '정지',
      '해지',
      'to없음',
      '탈퇴',
      '폐업',
      '폐업해지',
      '연락두절',
      '테스트'
    ];

    return excludeKeywords.some(kw => cleanNoSpace.includes(kw));
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

  findNoColumn(rows, keys) {
    if (!keys || keys.length === 0) return null;

    // 1. 정확한 NO / 번호 컬럼 우선 탐색 (숫자 데이터 확인)
    const exactTargets = ['no.', 'no', '화원사no', '농장no', '번호', '화원사번호', '화원번호', '코드', '화원사코드'];
    for (const target of exactTargets) {
      const found = keys.find(k => {
        const clean = k.replace(/\s+/g, '').toLowerCase();
        return clean === target && this.isColumnNumeric(rows, k);
      });
      if (found) return found;
    }

    // 2. 부분 일치 탐색 (단, 반드시 숫자 데이터가 들어있는 컬럼이어야 함!)
    const partialTargets = ['no', '번호', '코드', '구분'];
    for (const target of partialTargets) {
      const found = keys.find(k => {
        const clean = k.replace(/\s+/g, '').toLowerCase();
        if (['주문', '전화', '연락', '일련', '송장', '배송', '금액', '수량', '비율'].some(ex => clean.includes(ex))) return false;
        return clean.includes(target) && this.isColumnNumeric(rows, k);
      });
      if (found) return found;
    }

    return null;
  },

  findNameColumn(rows, keys) {
    const excludedTokens = ['번호', '코드', 'id', 'no.', '구분', '일련', '배송비', '배송료', '옵션', '수량', '건수', '금액', '가격', '단가', '수수료', '발주율', '진행률', '달성률', '비율', '받는분', '연락처', '전화', '일시', '일자', '요청일', '수정일', '지역', '시군구', '주소', '별칭'];
    const isExcludedKey = (k) => {
      const clean = k.replace(/\s+/g, '').toLowerCase();
      return excludedTokens.some(ex => clean.includes(ex));
    };

    // [핵심] 원본 데이터 '농장' 및 '화원사명' 컬럼 최우선 탐색
    const exactTargets = ['농장', '농장명', '출하농장', '화원사명', '화원명', '담당화원사', '수주화원사명', '수주화원사', '발주화원사', '화원사', '상호명', '상호', '업체명'];
    for (const target of exactTargets) {
      const found = keys.find(k => k.replace(/\s+/g, '') === target && !isExcludedKey(k) && !this.isColumnNumeric(rows, k));
      if (found) return found;
    }

    const partialTargets = ['농장', '화원사명', '화원명', '담당화원사', '화원사', '화원', '상호', '업체', '가맹점'];
    for (const target of partialTargets) {
      const found = keys.find(k => k.replace(/\s+/g, '').includes(target) && !isExcludedKey(k) && !this.isColumnNumeric(rows, k));
      if (found) return found;
    }

    return keys.find(k => !isExcludedKey(k) && !this.isColumnNumeric(rows, k)) || keys[0];
  },

  findAliasColumn(keys) {
    if (!keys || keys.length === 0) return null;
    const targets = ['화원별칭', '별칭', '상호명', '상호', '비고'];
    for (const t of targets) {
      const found = keys.find(k => k.replace(/\s+/g, '').toLowerCase().includes(t));
      if (found) return found;
    }
    return null;
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

  // 원본 데이터의 화원사명/농장 이름과 100% 동일하게 유지 (기호 임의 제거 안 함)
  normalizeFloristName(name) {
    if (!name) return '';
    return String(name).trim();
  },

  extractFloristEntries(rows) {
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0]);
    const noKey = this.findNoColumn(rows, keys);
    const nameKey = this.findNameColumn(rows, keys);
    const aliasKey = this.findAliasColumn(keys);
    const qtyKey = this.findQtyColumn(keys);

    return rows.map((r, idx) => {
      // 1. 고유 식별 번호 (NO.)
      let noVal = '';
      if (noKey && r[noKey] !== undefined && r[noKey] !== null) {
        const rawNo = String(r[noKey]).trim();
        if (rawNo && rawNo.toLowerCase() !== 'nan') {
          noVal = rawNo;
        }
      }

      // 2. 화원사명 및 화원별칭
      let nameVal = '';
      if (nameKey && r[nameKey] !== undefined && r[nameKey] !== null) {
        const rawName = String(r[nameKey]).trim();
        if (rawName && rawName.toLowerCase() !== 'nan') {
          nameVal = this.normalizeFloristName(rawName);
        }
      }

      let aliasVal = '';
      if (aliasKey && r[aliasKey] !== undefined && r[aliasKey] !== null) {
        const rawAlias = String(r[aliasKey]).trim();
        if (rawAlias && rawAlias.toLowerCase() !== 'nan') {
          aliasVal = rawAlias;
        }
      }

      // [핵심] NO.가 있으면 NO를 최우선 고유 키로 비교하여 동일 화원사로 매칭!
      // NO.가 없으면 화원사명을 키로 사용
      const idKey = noVal ? `NO:${noVal}` : (nameVal ? `NAME:${nameVal}` : `ROW:${idx}`);

      // 제외 조건: 화원사명 또는 화원별칭에 보류, 정지, 해지, TO없음, to없음, 탈퇴, 폐업, 폐업해지 포함 여부 전수 검사
      const excluded = !nameVal || this.isExcluded(nameVal, aliasVal);
      const qty = this.parseOrderQty(r, qtyKey);

      return {
        idKey,
        no: noVal,
        name: nameVal,
        alias: aliasVal,
        excluded,
        qty
      };
    }).filter(e => e.idKey);
  },

  execute(prevRows, currRows) {
    if (!prevRows || !currRows) {
      throw new Error("전월 발주 데이터와 당월 발주 데이터가 모두 필요합니다.");
    }

    const normPrev = this.normalizeRows(prevRows);
    const normCurr = this.normalizeRows(currRows);

    const prevEntries = this.extractFloristEntries(normPrev);
    const currEntries = this.extractFloristEntries(normCurr);

    // [핵심] 이전 또는 당월 데이터 중 어느 한 쪽이라도 (해지), (보류) 등이 있으면 해당 NO는 전수 제외!
    const excludedKeys = new Set();
    prevEntries.forEach(e => {
      if (e.excluded) excludedKeys.add(e.idKey);
    });
    currEntries.forEach(e => {
      if (e.excluded) excludedKeys.add(e.idKey);
    });

    // 대표 화원사명 및 No. 맵 구성 (당월 최신 명칭 우선)
    const nameMap = {};
    const noMap = {};
    prevEntries.forEach(e => {
      if (e.name) nameMap[e.idKey] = e.name;
      if (e.no) noMap[e.idKey] = e.no;
    });
    currEntries.forEach(e => {
      if (e.name) nameMap[e.idKey] = e.name;
      if (e.no) noMap[e.idKey] = e.no;
    });

    // [핵심] 동일 NO. 기준 발주수량 합산
    const prevCounts = {};
    prevEntries.forEach(e => {
      if (excludedKeys.has(e.idKey)) return;
      if (e.qty > 0) {
        prevCounts[e.idKey] = (prevCounts[e.idKey] || 0) + e.qty;
      }
    });

    const currCounts = {};
    currEntries.forEach(e => {
      if (excludedKeys.has(e.idKey)) return;
      if (e.qty > 0) {
        currCounts[e.idKey] = (currCounts[e.idKey] || 0) + e.qty;
      }
    });

    // 유효 활동 화원사 목록 추출
    const allFloristKeys = Array.from(new Set([...Object.keys(prevCounts), ...Object.keys(currCounts)]))
      .filter(k => (prevCounts[k] || 0) > 0 || (currCounts[k] || 0) > 0);

    let prevFilteredTotal = 0;
    let currFilteredTotal = 0;

    const floristComparison = allFloristKeys.map(k => {
      const p = prevCounts[k] || 0;
      const c = currCounts[k] || 0;
      const diff = c - p;
      const rate = p > 0 ? Number(((diff / p) * 100).toFixed(1)) : (c > 0 ? 100.0 : 0.0);

      prevFilteredTotal += p;
      currFilteredTotal += c;

      return {
        idKey: k,
        no: noMap[k] || '-',
        floristName: nameMap[k] || `화원사 (${k})`,
        prevOrders: p,
        currOrders: c,
        diff: diff,
        growthRate: rate
      };
    });

    const diffOrders = currFilteredTotal - prevFilteredTotal;
    const growthRate = prevFilteredTotal > 0 ? ((diffOrders / prevFilteredTotal) * 100).toFixed(2) : '0.00';

    // 정렬: 순증감(diff) 내림차순 -> 당월수량 내림차순 -> 화원사명 오름차순
    floristComparison.sort((a, b) =>
      (b.diff - a.diff) ||
      (b.currOrders - a.currOrders) ||
      (b.growthRate - a.growthRate) ||
      a.floristName.localeCompare(b.floristName, 'ko')
    );

    floristComparison.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return {
      type: 'table_only',
      title: '1-1. 화원사별 이전달 대비 현재달 발주 추이 비교 결과 (화원사의 체인발주 수량)',
      kpis: [
        { label: '유효 활동 화원사', value: `${allFloristKeys.length}개사`, sub: '해지/보류/정지/탈퇴/폐업/to없음 제외' },
        { label: '이전 총 체인발주 수량', value: `${prevFilteredTotal.toLocaleString()}건`, sub: '유효 화원사 합산' },
        { label: '현 총 체인발주 수량', value: `${currFilteredTotal.toLocaleString()}건`, sub: '유효 화원사 합산' },
        { 
          label: '전체 발주 순증감', 
          value: `${diffOrders >= 0 ? '+' : ''}${diffOrders.toLocaleString()}건`, 
          isPositive: diffOrders >= 0,
          sub: `${growthRate >= 0 ? '+' : ''}${growthRate}%` 
        }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'no', label: 'NO.' },
        { key: 'floristName', label: '농장(화원사명)' },
        { key: 'prevOrders', label: '이전 체인발주 수량' },
        { key: 'currOrders', label: '현재 체인발주 수량' },
        { key: 'diff', label: '순증감 (건)' },
        { key: 'growthRate', label: '증감율 (%)' }
      ],
      data: floristComparison
    };
  }
};

if (typeof window !== 'undefined') {
  window.OrderTrendModule = OrderTrendModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderTrendModule;
}
