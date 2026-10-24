/**
 * 분석 모듈 2: 증가 화원사 1위~10위 추출 (floristRanking.js)
 * 기준: 발주 건수 순증가량
 * 요구사항: 표(Table)와 그래프(Chart) 2가지 모두 동시 렌더링!
 * 필터링: (보류), (정지), (해지) 화원사 전수 제외!
 */
const FloristRankingModule = {
  id: 'topFlorists',
  name: '1-2. 발주증가 화원사 1위~10위 추출 (화원사의 체인발주 수량)',
  description: '화원사의 체인발주 수량 기준 이전 대비 발주증가 수량(현재-이전)이 가장 큰 상위 1위~10위 화원사를 표와 그래프로 시각화합니다. ((해지), (보류), (정지), (탈퇴), (폐업), (to없음) 제외)',
  icon: '🏆',

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

  execute(prevRows, currRows, topN = 10) {
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

    const rankingList = [];

    allFloristKeys.forEach(k => {
      const p = prevCounts[k] || 0;
      const c = currCounts[k] || 0;
      const inc = c - p;
      if (inc <= 0) return; // 증가한 화원사만 추출!

      const rate = p > 0 ? Number(((inc / p) * 100).toFixed(1)) : 100.0;

      rankingList.push({
        idKey: k,
        no: noMap[k] || '-',
        floristName: nameMap[k] || `화원사 (${k})`,
        prevOrders: p,
        currOrders: c,
        increaseOrders: inc,
        growthRate: rate
      });
    });

    // 발주 증가량 내림차순 정렬 -> 당월수량 내림차순 -> 화원사명 오름차순
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
        { label: '발주증가 1위 화원사', value: topData[0]?.floristName || '-', sub: `이전 ${topData[0]?.prevOrders || 0}건 → 현재 ${topData[0]?.currOrders || 0}건 (+${topData[0]?.increaseOrders || 0}건)` },
        { label: 'TOP 10 총 발주증가량', value: `+${totalIncreaseInTop10.toLocaleString()}건`, isPositive: true, sub: '체인발주 순증가 1~10위 합산' },
        { label: '발주증가 / 활동 화원사', value: `${rankingList.length}개사 / ${allFloristKeys.length}개사`, sub: '체인발주 증가 화원사 비중' }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'no', label: 'NO.' },
        { key: 'floristName', label: '농장(화원사명)' },
        { key: 'prevOrders', label: '이전 체인발주 수량' },
        { key: 'currOrders', label: '현재 체인발주 수량' },
        { key: 'increaseOrders', label: '체인발주 순증가량 (건)' },
        { key: 'growthRate', label: '이전 대비 증가율 (%)' }
      ],
      tableData: topData,
      chartData: {
        labels: topData.map(d => d.floristName),
        datasets: [
          {
            label: '발주증가 수량 (현재-이전)',
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
