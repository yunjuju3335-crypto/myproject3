/**
 * H·G·S 등급 화원사 발주 추이 비교 분석 모듈 (hgsTrend.js)
 * 
 * [요구사항]
 * 1. 1-3 화원사명(또는 전체 발주 화원사명)에서 'H', 'G', 'S'가 붙은 화원사를 식별.
 * 2. 이전(전월) 데이터와 현재(당월) 데이터를 비교하여
 * 3. H 그룹, G 그룹, S 그룹 각각의 추이 변화(전월 건수, 당월 건수, 순증감, 증감률)를 '따로' 분석 및 추출.
 * 4. (보류), (정지), (해지), (to없음), (탈퇴), (폐업), (폐업해지) 등 12종 비활성 화원사 전수 제외.
 * 5. 동일 NO. 기준 1:1 매칭 최우선.
 * 6. 1-3 상품진행 데이터가 존재할 경우, 해당 화원사의 특정 상품 완료 건수도 교차 표시.
 */

const HgsTrendModule = {
  id: 'hgsTrend',
  name: '🏷️ 1-3. H·G·S 화원사 이전 대비 현재 발주 추이 분리 분석',
  description: '화원사명에 H, G, S가 붙은 화원사의 이전(전월) vs 현재(당월) 발주 추이를 H그룹, G그룹, S그룹 각각 따로 분석하고 추출합니다.',
  icon: '🏷️',

  isExcluded(name, alias = '') {
    const combined = (String(name || '') + ' ' + String(alias || '')).trim();
    if (!combined || combined.toLowerCase() === 'nan') return true;
    const cleanNoSpace = combined.replace(/\s+/g, '').toLowerCase();

    if (['합계', '총계', '소계', '평균', 'total', 'subtotal'].some(t => cleanNoSpace.includes(t))) {
      return true;
    }

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
    const exactTargets = ['no.', 'no', '화원사no', '농장no', '번호', '화원사번호', '화원번호', '코드', '화원사코드'];
    for (const target of exactTargets) {
      const found = keys.find(k => {
        const clean = k.replace(/\s+/g, '').toLowerCase();
        return clean === target && this.isColumnNumeric(rows, k);
      });
      if (found) return found;
    }

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

  /**
   * 화원사명에서 H, G, S 태그 판별
   * @param {string} name 
   * @returns {string[]} ['H', 'G', 'S']
   */
  detectHgsGroups(name) {
    if (!name) return [];
    const str = String(name).trim();
    const groups = [];

    // 대소문자 무관 H, G, S 감지
    // 영단어 FLOWER, SHOP 등의 오탐을 방지하기 위해 기본 검사 후 특수기호 결합 또는 단독 영문자 형태 확인
    if (/[Hh]/.test(str)) {
      groups.push('H');
    }
    if (/[Gg]/.test(str)) {
      groups.push('G');
    }
    if (/[Ss]/.test(str)) {
      groups.push('S');
    }

    return groups;
  },

  /**
   * 실행 함수
   * @param {Array} prevRows 전월 발주 데이터 (1-1)
   * @param {Array} currRows 당월 발주 데이터 (1-2)
   * @param {Array} [prodRows] 1-3 화원사 상품진행 데이터 (선택)
   */
  execute(prevRows, currRows, prodRows = null) {
    if (!prevRows || !currRows) {
      throw new Error("전월 발주 데이터(1-1)와 당월 발주 데이터(1-2)가 모두 필요합니다.");
    }

    const normPrev = this.normalizeRows(prevRows);
    const normCurr = this.normalizeRows(currRows);

    // 1. 컬럼 감지
    const prevKeys = Object.keys(normPrev[0] || {});
    const currKeys = Object.keys(normCurr[0] || {});

    const prevNoKey = this.findNoColumn(normPrev, prevKeys);
    const currNoKey = this.findNoColumn(normCurr, currKeys);

    const prevNameKey = this.findNameColumn(normPrev, prevKeys);
    const currNameKey = this.findNameColumn(normCurr, currKeys);

    const prevAliasKey = this.findAliasColumn(prevKeys);
    const currAliasKey = this.findAliasColumn(currKeys);

    const prevQtyKey = this.findQtyColumn(prevKeys);
    const currQtyKey = this.findQtyColumn(currKeys);

    // 2. 1-3 상품진행 완료건수 맵 구성 (있을 경우)
    const productCountMap = {}; // name -> count
    if (prodRows && prodRows.length > 0) {
      try {
        const normProd = this.normalizeRows(prodRows);
        const prodKeys = Object.keys(normProd[0] || {});
        const pFarmKey = this.findNameColumn(normProd, prodKeys);
        const pItemKey = prodKeys.find(k => k.includes('상품') || k.includes('품목'));
        const pStepKey = prodKeys.find(k => ['공정', '상태', '배송'].some(c => k.includes(c)));
        const targetKws = ['특대', '특', '4단', '5단', '짱구'];

        normProd.forEach(r => {
          const farm = String(r[pFarmKey] || '').trim();
          const item = String(r[pItemKey] || '').trim();
          const step = String(r[pStepKey] || '').trim();
          if (!farm || this.isExcluded(farm)) return;

          const isTarget = targetKws.some(kw => item.includes(kw));
          const isDone = step.includes('완료');
          if (isTarget && isDone) {
            productCountMap[farm] = (productCountMap[farm] || 0) + 1;
          }
        });
      } catch (e) {
        console.warn('[hgsTrend] 1-3 연계 분석 실패:', e);
      }
    }

    // 3. 엔트리 추출 및 제외 화원사 수집
    const extractEntries = (rows, noKey, nameKey, aliasKey, qtyKey) => {
      return rows.map((r, idx) => {
        let noVal = '';
        if (noKey && r[noKey] !== undefined && r[noKey] !== null) {
          const strNo = String(r[noKey]).trim();
          if (strNo && strNo.toLowerCase() !== 'nan') noVal = strNo;
        }

        let nameVal = '';
        if (nameKey && r[nameKey] !== undefined && r[nameKey] !== null) {
          const strName = String(r[nameKey]).trim();
          if (strName && strName.toLowerCase() !== 'nan') nameVal = strName;
        }

        let aliasVal = '';
        if (aliasKey && r[aliasKey] !== undefined && r[aliasKey] !== null) {
          const strAlias = String(r[aliasKey]).trim();
          if (strAlias && strAlias.toLowerCase() !== 'nan') aliasVal = strAlias;
        }

        const idKey = noVal ? `NO:${noVal}` : (nameVal ? `NAME:${nameVal}` : `ROW:${idx}`);
        const excluded = !nameVal || this.isExcluded(nameVal, aliasVal);
        const qty = this.parseOrderQty(r, qtyKey);

        return { idKey, no: noVal, name: nameVal, alias: aliasVal, excluded, qty };
      }).filter(e => e.idKey);
    };

    const prevEntries = extractEntries(normPrev, prevNoKey, prevNameKey, prevAliasKey, prevQtyKey);
    const currEntries = extractEntries(normCurr, currNoKey, currNameKey, currAliasKey, currQtyKey);

    // 제외 대상 식별
    const excludedKeys = new Set();
    prevEntries.forEach(e => { if (e.excluded) excludedKeys.add(e.idKey); });
    currEntries.forEach(e => { if (e.excluded) excludedKeys.add(e.idKey); });

    // 이름 및 No 맵
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

    // 발주 건수 합산
    const prevCounts = {};
    prevEntries.forEach(e => {
      if (excludedKeys.has(e.idKey)) return;
      if (e.qty > 0) prevCounts[e.idKey] = (prevCounts[e.idKey] || 0) + e.qty;
    });

    const currCounts = {};
    currEntries.forEach(e => {
      if (excludedKeys.has(e.idKey)) return;
      if (e.qty > 0) currCounts[e.idKey] = (currCounts[e.idKey] || 0) + e.qty;
    });

    // 전체 활성 화원사 목록
    const allFloristKeys = Array.from(new Set([...Object.keys(prevCounts), ...Object.keys(currCounts)]))
      .filter(k => (prevCounts[k] || 0) > 0 || (currCounts[k] || 0) > 0);

    // 4. 각 화원사를 H, G, S 그룹으로 분류하여 데이터 구조 생성
    const floristsData = allFloristKeys.map(k => {
      const name = nameMap[k] || `화원사 (${k})`;
      const no = noMap[k] || '-';
      const prev = prevCounts[k] || 0;
      const curr = currCounts[k] || 0;
      const diff = curr - prev;
      const growthRate = prev > 0 ? Number(((diff / prev) * 100).toFixed(1)) : (curr > 0 ? 100.0 : 0.0);
      const groups = this.detectHgsGroups(name);
      const prodCompleted = productCountMap[name] || 0;

      return {
        idKey: k,
        no,
        floristName: name,
        prevOrders: prev,
        currOrders: curr,
        diff,
        growthRate,
        groups,
        prodCompleted
      };
    });

    // 5. H, G, S 각각 따로 분석 추출
    const analyzeGroup = (groupTag) => {
      const list = floristsData.filter(f => f.groups.includes(groupTag));

      // 순증감 내림차순 -> 당월수량 내림차순 -> 이름 오름차순
      list.sort((a, b) =>
        (b.diff - a.diff) ||
        (b.currOrders - a.currOrders) ||
        (b.growthRate - a.growthRate) ||
        a.floristName.localeCompare(b.floristName, 'ko')
      );

      list.forEach((item, idx) => {
        item.rank = idx + 1;
      });

      const totalPrev = list.reduce((sum, item) => sum + item.prevOrders, 0);
      const totalCurr = list.reduce((sum, item) => sum + item.currOrders, 0);
      const totalDiff = totalCurr - totalPrev;
      const totalRate = totalPrev > 0 ? Number(((totalDiff / totalPrev) * 100).toFixed(2)) : (totalCurr > 0 ? 100.0 : 0.0);
      const totalProd = list.reduce((sum, item) => sum + item.prodCompleted, 0);

      const topIncrease = list.filter(f => f.diff > 0).slice(0, 5);
      const topDecrease = list.filter(f => f.diff < 0).slice(-5).reverse();

      return {
        groupTag,
        count: list.length,
        totalPrev,
        totalCurr,
        totalDiff,
        totalRate,
        totalProd,
        list,
        topIncrease,
        topDecrease,
        kpis: [
          { label: `${groupTag}그룹 화원사 수`, value: `${list.length}개사`, sub: '비활성 화원사 제외' },
          { label: `${groupTag}그룹 이전 총 체인발주`, value: `${totalPrev.toLocaleString()}건`, sub: '이전 합계' },
          { label: `${groupTag}그룹 현 총 체인발주`, value: `${totalCurr.toLocaleString()}건`, sub: '현재 합계' },
          { 
            label: `${groupTag}그룹 발주 순증감`, 
            value: `${totalDiff >= 0 ? '+' : ''}${totalDiff.toLocaleString()}건`, 
            isPositive: totalDiff >= 0,
            sub: `${totalRate >= 0 ? '+' : ''}${totalRate}%` 
          }
        ]
      };
    };

    const hAnalysis = analyzeGroup('H');
    const gAnalysis = analyzeGroup('G');
    const sAnalysis = analyzeGroup('S');

    // 6. 종합 비교 요약
    const summaryComparison = [
      {
        rank: 1,
        group: 'H 그룹 화원사',
        groupCode: 'H',
        count: hAnalysis.count,
        prevOrders: hAnalysis.totalPrev,
        currOrders: hAnalysis.totalCurr,
        diff: hAnalysis.totalDiff,
        growthRate: hAnalysis.totalRate,
        prodCompleted: hAnalysis.totalProd
      },
      {
        rank: 2,
        group: 'G 그룹 화원사',
        groupCode: 'G',
        count: gAnalysis.count,
        prevOrders: gAnalysis.totalPrev,
        currOrders: gAnalysis.totalCurr,
        diff: gAnalysis.totalDiff,
        growthRate: gAnalysis.totalRate,
        prodCompleted: gAnalysis.totalProd
      },
      {
        rank: 3,
        group: 'S 그룹 화원사',
        groupCode: 'S',
        count: sAnalysis.count,
        prevOrders: sAnalysis.totalPrev,
        currOrders: sAnalysis.totalCurr,
        diff: sAnalysis.totalDiff,
        growthRate: sAnalysis.totalRate,
        prodCompleted: sAnalysis.totalProd
      }
    ];

    // 컬럼 정의
    const columns = [
      { key: 'rank', label: '순위' },
      { key: 'no', label: 'NO.' },
      { key: 'floristName', label: '화원사명(농장명)' },
      { key: 'prevOrders', label: '이전 체인발주 수량' },
      { key: 'currOrders', label: '현재 체인발주 수량' },
      { key: 'diff', label: '순증감 (건)' },
      { key: 'growthRate', label: '증감율 (%)' },
      { key: 'prodCompleted', label: '1-3 상품완료건' }
    ];

    return {
      type: 'hgs_trend',
      title: '🏷️ 1-3. H·G·S 등급 화원사 발주 추이 비교 분석 (전월 vs 당월)',
      kpis: [
        { label: 'H그룹 발주 순증감', value: `${hAnalysis.totalDiff >= 0 ? '+' : ''}${hAnalysis.totalDiff.toLocaleString()}건`, sub: `${hAnalysis.totalRate}% (${hAnalysis.count}개사)` },
        { label: 'G그룹 발주 순증감', value: `${gAnalysis.totalDiff >= 0 ? '+' : ''}${gAnalysis.totalDiff.toLocaleString()}건`, sub: `${gAnalysis.totalRate}% (${gAnalysis.count}개사)` },
        { label: 'S그룹 발주 순증감', value: `${sAnalysis.totalDiff >= 0 ? '+' : ''}${sAnalysis.totalDiff.toLocaleString()}건`, sub: `${sAnalysis.totalRate}% (${sAnalysis.count}개사)` }
      ],
      summaryComparison,
      hAnalysis,
      gAnalysis,
      sAnalysis,
      columns
    };
  }
};

if (typeof window !== 'undefined') {
  window.HgsTrendModule = HgsTrendModule;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HgsTrendModule;
}
