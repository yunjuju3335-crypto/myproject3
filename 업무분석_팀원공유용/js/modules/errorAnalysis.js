/**
 * 4. 현재 달의 오류 분석 모듈 (errorAnalysis.js)
 * 기준: 실수자, 처리일시, 실수금액, 실수유형
 * 표시방식: 모든 결과는 표(Table)로 렌더링
 */
const ErrorAnalysisModule = {
  id: 'errorAnalysis',
  name: '4. 상담원 오류(excel) 분석 (기준: 실수자, 처리일시, 실수금액, 실수유형)',
  description: '4. 상담원 오류(excel) 기준으로 상담원별 발생 오류 건수, 실수금액, 실수유형 및 세부 내역을 전수 집계하여 표(Table)로 표시합니다.',
  icon: '⚠️',

  parseYm(val) {
    if (window.DataIntegrityAuditor && window.DataIntegrityAuditor.parseYm) {
      return window.DataIntegrityAuditor.parseYm(val);
    }
    if (!val && val !== 0) return '';
    const s = String(val).trim();
    const m = s.match(/(\d{4})[-/\.](\d{1,2})/);
    return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : '';
  },

  formatDate(val) {
    if (window.DataIntegrityAuditor && window.DataIntegrityAuditor.parseDate) {
      return window.DataIntegrityAuditor.parseDate(val);
    }
    return String(val || '').split(' ')[0].trim();
  },

  execute(errorRows, options = {}) {
    if (!errorRows || errorRows.length === 0) {
      throw new Error("오류 원본 데이터가 없습니다. 먼저 칼럼 1에서 [4. 오류 원본 엑셀]을 업로드해주세요.");
    }

    const sample = errorRows[0];
    const keys = Object.keys(sample);

    // 컬럼 자동 매칭: 상담원, 상담사, 실수자, 오류자, 담당자, 접수자, 작성자, 직원, 사원, 성명, 이름
    const staffKeywords = ['상담원', '상담사', '상담자', '실수자', '오류자', '담당자', '접수자', '작성자', '직원', '사원', '성명', '이름'];
    const staffKey = keys.find(k => {
      const clean = k.replace(/\s+/g, '').toLowerCase();
      return staffKeywords.some(c => clean.includes(c));
    }) || keys[0];
    const dateKey = keys.find(k => ['처리일시', '처리일', '발생일시', '일시', '일자', '발생일'].some(c => k.includes(c))) || keys[1] || keys[0];
    const costKey = keys.find(k => ['실수금액', '손실금액', '오류금액', '금액', '비용', '손해액'].some(c => k.includes(c)));
    const typeKey = keys.find(k => ['실수유형', '오류유형', '유형', '구분', '원인'].some(c => k.includes(c)) && !['금액', '일시'].some(ex => k.includes(ex)));
    const detailKey = keys.find(k => ['오류상세내용', '상세내용', '내용', '메모', '비고'].some(c => k.includes(c)));
    const orderNoKey = keys.find(k => ['주문번호', '번호', '일련번호', 'id'].some(c => k.toLowerCase().includes(c)));

    const ymList = errorRows.map(r => this.parseYm(r[dateKey])).filter(Boolean);
    const modeYm = ymList.length > 0
      ? ymList.sort((a,b) => ymList.filter(v => v===a).length - ymList.filter(v => v===b).length).pop()
      : new Date().toISOString().slice(0, 7);

    const targetMonth = options.month || modeYm;

    let filteredRows = errorRows.filter(r => {
      const ym = this.parseYm(r[dateKey]);
      return !ym || ym === targetMonth;
    });

    let isFallback = false;
    if (filteredRows.length === 0) {
      filteredRows = errorRows;
      isFallback = true;
    }

    const totalCount = filteredRows.length;
    let totalCost = 0;

    const staffMap = {};
    const typeMap = {};

    filteredRows.forEach((r, idx) => {
      const rawStaff = String(r[staffKey] || '미지정').trim();
      const staff = (!rawStaff || rawStaff.toLowerCase() === 'nan') ? '미지정' : rawStaff;
      const errType = typeKey && r[typeKey] ? String(r[typeKey]).trim() : '일반오류';
      const cost = costKey ? (Number(r[costKey]) || 0) : 0;
      totalCost += cost;

      // 직원별
      if (!staffMap[staff]) {
        staffMap[staff] = {
          staffName: staff,
          errorCount: 0,
          totalCost: 0,
          typeCounts: {}
        };
      }
      staffMap[staff].errorCount += 1;
      staffMap[staff].totalCost += cost;
      staffMap[staff].typeCounts[errType] = (staffMap[staff].typeCounts[errType] || 0) + 1;

      // 유형별
      if (!typeMap[errType]) {
        typeMap[errType] = {
          errorType: errType,
          count: 0,
          totalCost: 0
        };
      }
      typeMap[errType].count += 1;
      typeMap[errType].totalCost += cost;
    });

    // 실수자 리스트 정리
    const staffList = Object.values(staffMap);
    staffList.sort((a, b) => b.totalCost - a.totalCost || b.errorCount - a.errorCount || a.staffName.localeCompare(b.staffName, 'ko'));

    staffList.forEach((s, idx) => {
      s.rank = idx + 1;
      s.avgCost = s.errorCount > 0 ? Math.round(s.totalCost / s.errorCount) : 0;
      const topTypeEntry = Object.entries(s.typeCounts).sort((a, b) => b[1] - a[1])[0];
      s.topErrorType = topTypeEntry ? `${topTypeEntry[0]} (${topTypeEntry[1]}건)` : '-';
    });

    // 유형 리스트 정리
    const typeList = Object.values(typeMap);
    typeList.sort((a, b) => b.count - a.count || b.totalCost - a.totalCost);

    typeList.forEach((t, idx) => {
      t.rank = idx + 1;
      t.rate = totalCount > 0 ? Number(((t.count / totalCount) * 100).toFixed(1)) : 0;
    });

    // 세부 상세 내역 리스트 (최대 50건 미리보기)
    const detailList = filteredRows.map((r, idx) => ({
      no: idx + 1,
      staffName: String(r[staffKey] || '미지정').trim(),
      date: this.formatDate(r[dateKey]),
      errorType: typeKey && r[typeKey] ? String(r[typeKey]).trim() : '일반오류',
      cost: costKey ? (Number(r[costKey]) || 0) : 0,
      orderNo: orderNoKey && r[orderNoKey] ? String(r[orderNoKey]).trim() : '-',
      detail: detailKey && r[detailKey] ? String(r[detailKey]).trim() : '-'
    }));

    const topStaff = staffList[0] || null;

    return {
      type: 'multi_tables',
      title: '4. 현재 달의 오류 (기준: 실수자, 처리일시, 실수금액, 실수유형)',
      targetMonth: isFallback ? '전체 기간' : targetMonth,
      kpis: [
        {
          label: isFallback ? '총 오류 발생건수 (전체)' : '당월 총 오류건수',
          value: `${totalCount.toLocaleString()}건`,
          isPositive: false,
          sub: isFallback ? '전체 기간 데이터 기준' : `${targetMonth} 발생 합계`
        },
        {
          label: '총 실수금액 (손실액)',
          value: `${totalCost.toLocaleString()}원`,
          isPositive: false,
          sub: totalCount > 0 ? `건당 평균 ${(Math.round(totalCost / totalCount)).toLocaleString()}원` : '-'
        },
        {
          label: '오류 발생 인원',
          value: `${staffList.length}명`,
          sub: '실수 등록 직원 수'
        },
        {
          label: '최다 실수자',
          value: topStaff ? topStaff.staffName : '-',
          sub: topStaff ? `${topStaff.errorCount}건 (${topStaff.totalCost.toLocaleString()}원)` : '내역 없음'
        }
      ],
      tables: [
        {
          title: `👤 ${isFallback ? '전체 기간' : targetMonth} 실수자별 오류 및 실수금액 집계표`,
          columns: [
            { key: 'rank', label: '순위' },
            { key: 'staffName', label: '실수자' },
            { key: 'errorCount', label: '오류건수 (건)' },
            { key: 'totalCost', label: '총 실수금액 (원)' },
            { key: 'avgCost', label: '건당 평균금액 (원)' },
            { key: 'topErrorType', label: '주요 실수유형' }
          ],
          data: staffList
        },
        {
          title: `🏷️ ${isFallback ? '전체 기간' : targetMonth} 실수유형별 통계표`,
          columns: [
            { key: 'rank', label: '순위' },
            { key: 'errorType', label: '실수유형' },
            { key: 'count', label: '발생건수 (건)' },
            { key: 'totalCost', label: '총 금액 (원)' },
            { key: 'rate', label: '비율 (%)' }
          ],
          data: typeList
        },
        {
          title: `📋 ${isFallback ? '전체 기간' : targetMonth} 발생 오류 상세 내역표`,
          columns: [
            { key: 'no', label: 'No' },
            { key: 'date', label: '처리일시' },
            { key: 'staffName', label: '실수자' },
            { key: 'errorType', label: '실수유형' },
            { key: 'cost', label: '실수금액 (원)' },
            { key: 'orderNo', label: '주문번호' },
            { key: 'detail', label: '오류상세내용' }
          ],
          data: detailList
        }
      ]
    };
  }
};

window.ErrorAnalysisModule = ErrorAnalysisModule;
