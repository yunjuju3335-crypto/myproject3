/**
 * 상품 진행 분석 모듈 (productProgress.js)
 * 기준: 화원사이름 (Florist Name)
 * 필터: 상품은 '특', '특대', '4단', '5단', '짱구' 완료건만 집계!
 * 제외: (보류), (정지), (해지) 등 12종 비활성 화원사 전수 제외!
 */
const ProductProgressModule = {
  id: 'productProgress',
  name: '2. 농장의 완료 건수 집계 (특·특대·4단·5단·짱구)',
  description: '농장 기준으로 상품(특, 특대, 4단, 5단, 짱구)의 완료 건수를 집계합니다. (완료 건수 0건인 농장은 집계/표시 제외)',
  icon: '🚚',

  targetKeywords: ['특대', '특', '4단', '5단', '짱구'],

  isTargetProduct(productName) {
    if (!productName) return false;
    const str = String(productName).trim();
    return this.targetKeywords.some(kw => str.includes(kw));
  },

  isCompleted(step, rate) {
    const s = String(step || '').trim();
    if (s.includes('완료')) return true;
    if (rate !== undefined && rate !== null) {
      const num = Number(rate);
      if (!isNaN(num) && num >= 100) return true;
    }
    return false;
  },

  isExcluded(name) {
    if (!name) return true;
    const str = String(name).trim();
    const regex = /[\(\[\<]\s*(to\s*없음|보류중|보류|연락두절|정지\.발주사|정지중|정지전불|정지|탈퇴폐업|탈퇴|폐업|테스트|해지)/i;
    if (regex.test(str)) return true;
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
    if (val === undefined || val === null) return false;
    const s = String(val).trim();
    if (!s) return false;
    return /^\d+(\.\d+)?$/.test(s);
  },

  isColumnNumeric(rows, colKey) {
    if (!colKey || !rows || rows.length === 0) return true;
    const sample = rows.slice(0, 30).map(r => r[colKey]).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (sample.length === 0) return true;
    const numCount = sample.filter(v => this.isPureNumber(v)).length;
    return (numCount / sample.length) >= 0.5;
  },

  normalizeRows(rows) {
    if (!rows || rows.length === 0) return [];
    const firstKeys = Object.keys(rows[0]);
    const hasEmptyKey = firstKeys.some(k => k.startsWith('__EMPTY'));
    if (!hasEmptyKey) return rows;

    const targetHeaders = ['농장', '화원사명', '화원별칭', '상품명', '배송'];
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const vals = Object.values(rows[i]).map(v => String(v || '').trim());
      if (targetHeaders.filter(th => vals.some(v => v.includes(th))).length >= 2) {
        const colMap = {};
        Object.entries(rows[i]).forEach(([k, v]) => {
          const cleanV = String(v || '').trim();
          if (cleanV) colMap[k] = cleanV;
        });
        return rows.slice(i + 1).map(r => {
          const newRow = {};
          Object.entries(colMap).forEach(([oldKey, newKey]) => {
            newRow[newKey] = r[oldKey];
          });
          return newRow;
        });
      }
    }
    return rows;
  },

  findFarmNameColumn(rows, keys) {
    const excludeWords = ['번호', '코드', 'no', 'no.', '구분', '구 분', '일련', '수량', '건수', '금액', '비율', '단가', '합계', '순위', '연락처', '전화', '배송비', '옵션', '받는분', '별칭'];
    const isExcludedKey = (k) => {
      const lower = k.trim().toLowerCase();
      return excludeWords.some(ex => lower === ex || lower.includes(ex));
    };

    const exactCandidates = ['농장', '화원사명', '농장명', '화원명', '담당화원사', '수주화원사명', '수주화원사', '발주화원사', '화원사', '업체명'];
    for (const target of exactCandidates) {
      const found = keys.find(k => k.trim() === target && !isExcludedKey(k));
      if (found && !this.isColumnNumeric(rows, found)) {
        return found;
      }
    }

    const partialCandidates = ['농장', '화원사명', '화원명', '담당화원사', '화원사', '화원', '업체', '가맹점', '상호'];
    for (const target of partialCandidates) {
      const found = keys.find(k => k.includes(target) && !isExcludedKey(k) && !this.isColumnNumeric(rows, k));
      if (found) return found;
    }

    const firstTextCol = keys.find(k => !isExcludedKey(k) && !this.isColumnNumeric(rows, k));
    return firstTextCol || keys[0];
  },

  execute(prodRows) {
    if (!prodRows || prodRows.length === 0) {
      throw new Error("상품 진행 데이터가 없습니다.");
    }

    const normRows = this.normalizeRows(prodRows);
    const keys = Object.keys(normRows[0]);
    const farmKey = this.findFarmNameColumn(normRows, keys);
    const itemKey = keys.find(k => k.includes('상품') || k.includes('품목')) || keys[0];
    const stepKey = keys.find(k => ['공정', '상태', '배송'].some(c => k.includes(c)) && !['배송비', '배송지', '배송일'].some(ex => k.includes(ex)));
    const rateKey = keys.find(k => k.includes('진행률') || k.toLowerCase().includes('rate'));

    const store = typeof window !== 'undefined' ? window.appStore : null;
    const numToNameMap = {};
    const collectMappings = (rowsList) => {
      if (!rowsList || rowsList.length === 0) return;
      const nRows = this.normalizeRows(rowsList);
      if (nRows.length === 0) return;
      const ks = Object.keys(nRows[0]);
      const kName = this.findFarmNameColumn(nRows, ks);
      const numKeys = ks.filter(k => k.includes('농장번호') || k.includes('번호') || k.includes('코드') || k.toLowerCase() === 'no.' || k.includes('구분') || k.includes('구 분'));

      nRows.forEach(r => {
        const c = kName ? String(r[kName] || '').trim() : '';
        if (c && !this.isPureNumber(c) && c.toLowerCase() !== 'nan') {
          numKeys.forEach(nk => {
            const nv = String(r[nk] || '').trim();
            if (this.isPureNumber(nv)) {
              numToNameMap[nv] = c;
            }
          });
        }
      });
    };

    collectMappings(normRows);
    if (store && store.state && store.state.vault) {
      ['prevOrders', 'currOrders', 'productProgress'].forEach(slot => {
        const slotData = store.state.vault[slot];
        if (slotData && slotData.rows) {
          collectMappings(slotData.rows);
        }
      });
    }

    const farmMap = {};
    let totalTargetCompleted = 0;

    normRows.forEach(r => {
      let rawFarm = String(r[farmKey] || '').trim();

      if (!rawFarm || this.isPureNumber(rawFarm)) {
        if (rawFarm && numToNameMap[rawFarm]) {
          rawFarm = numToNameMap[rawFarm];
        } else {
          return;
        }
      }

      if (this.isExcluded(rawFarm)) {
        return; // (보류), (정지), (해지) 화원사 제외
      }

      const item = String(r[itemKey] || '기타').trim();
      const step = String(r[stepKey] || '').trim();
      const rate = r[rateKey];

      // 원본자료의 화원사명/농장 이름을 그대로 사용하되, ~호 뒤에 붙은 기호는 무시
      const exactName = String(rawFarm).replace(/(\d+호(?:\s*[가-힣]+)?)[^가-힣]*$/, '$1').trim();
      if (!exactName || this.isExcluded(exactName)) {
        return;
      }

      if (!farmMap[exactName]) {
        farmMap[exactName] = {
          farmName: exactName,
          floristName: exactName,
          targetCompletedCount: 0,
          itemsBreakdown: {}
        };
      }

      // [핵심 조건] 특, 특대, 4단, 5단, 짱구 상품이고 완료건만 집계!
      if (this.isTargetProduct(item) && this.isCompleted(step, rate)) {
        farmMap[exactName].targetCompletedCount += 1;
        farmMap[exactName].itemsBreakdown[item] = (farmMap[exactName].itemsBreakdown[item] || 0) + 1;
        totalTargetCompleted += 1;
      }
    });

    // [핵심 요구사항] "건수가 0인것은 집계하지 않는다. 표시하지 않는다"
    const activeFarms = Object.values(farmMap).filter(f => f.targetCompletedCount > 0);

    const summaryList = activeFarms.map(fData => {
      const itemsDetail = Object.entries(fData.itemsBreakdown).length > 0
        ? Object.entries(fData.itemsBreakdown)
            .map(([name, cnt]) => `${name} ${cnt}건`)
            .join(', ')
        : '완료 내역 없음';

      return {
        farmName: fData.farmName,
        floristName: fData.floristName,
        targetCompletedCount: fData.targetCompletedCount,
        itemsDetail: itemsDetail
      };
    });

    // 완료건수 많은 순 내림차순 정렬, 동률 시 농장명 가나다순
    summaryList.sort((a, b) => {
      if (b.targetCompletedCount !== a.targetCompletedCount) {
        return b.targetCompletedCount - a.targetCompletedCount;
      }
      return a.farmName.localeCompare(b.farmName, 'ko');
    });

    summaryList.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    const topFarm = summaryList[0] || null;

    return {
      type: 'table_only',
      title: '2. 농장의 완료 건수 집계 (특·특대·4단·5단·짱구 완료건, 0건 제외)',
      kpis: [
        { 
          label: '타겟 상품 총 완료건수', 
          value: `${totalTargetCompleted.toLocaleString()}건`, 
          isPositive: totalTargetCompleted > 0,
          sub: '특·특대·4단·5단·짱구 완료' 
        },
        { 
          label: '유효 완료 농장 수', 
          value: `${summaryList.length}개 농장`, 
          sub: '0건인 농장 제외 완료' 
        },
        { 
          label: '최다 완료 농장', 
          value: topFarm ? `${topFarm.farmName}` : '-', 
          sub: topFarm ? `+${topFarm.targetCompletedCount}건 완료` : '내역 없음' 
        }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'farmName', label: '농장 (화원사명)' },
        { key: 'targetCompletedCount', label: '완료건수 (특·특대·4단·5단·짱구)' },
        { key: 'itemsDetail', label: '완료 상품 세부 내역' }
      ],
      data: summaryList
    };
  }
};

window.ProductProgressModule = ProductProgressModule;
