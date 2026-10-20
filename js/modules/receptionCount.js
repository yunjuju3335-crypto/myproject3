/**
 * 3. 현재 달의 접수 수량 분석 모듈 (receptionCount.js)
 * 기준: 접수자, 배송일, 완료
 * 표시방식: 모든 결과는 표(Table)로 렌더링
 */
const ReceptionCountModule = {
  id: 'receptionCount',
  name: '3. 현재 달의 접수 수량 (기준: 접수자, 배송일, 완료)',
  description: '접수자별로 배송이 완료된 당월 접수 수량 및 일자별 추이를 전수 집계하여 표(Table)로 표시합니다.',
  icon: '📋',

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

  execute(receiptRows, options = {}) {
    if (!receiptRows || receiptRows.length === 0) {
      throw new Error("접수 원본 데이터가 없습니다. 먼저 칼럼 1에서 [3. 접수 원본 엑셀]을 업로드해주세요.");
    }

    const sample = receiptRows[0];
    const keys = Object.keys(sample);

    // 컬럼 자동 매칭
    const staffKey = keys.find(k => ['접수자', '담당자', '작성자', '직원', '사원', '이름'].some(c => k.includes(c))) || keys[0];
    const dateKey = keys.find(k => ['배송일', '배송요청일', '배송일시', '접수일', '일자'].includes(k))
      || keys.find(k => ['배송일', '요청일', '일시', '일자', '일'].some(c => k.includes(c)))
      || keys[1] || keys[0];

    const statusKey = keys.find(k => ['배송', '상태', '배송상태', '진행상태', '공정', '처리'].includes(k))
      || keys.find(k => ['배송상태', '상태', '공정', '배송'].some(c => k.includes(c)) && !['배송비', '배송지', '배송일', '일시', '요청일', '주소', '일자'].some(ex => k.includes(ex)));

    const qtyKey = keys.find(k => ['수량', '접수수량', '주문수량'].some(c => k.includes(c)) && !['금액', '가격'].some(ex => k.includes(ex)));

    // 날짜별 파싱
    const ymList = receiptRows.map(r => this.parseYm(r[dateKey])).filter(Boolean);
    const modeYm = ymList.length > 0
      ? ymList.sort((a,b) => ymList.filter(v => v===a).length - ymList.filter(v => v===b).length).pop()
      : new Date().toISOString().slice(0, 7);

    const targetMonth = options.month || modeYm;

    // 1차 필터링: 당월 & 완료 상태
    let filteredRows = receiptRows.filter(r => {
      const ym = this.parseYm(r[dateKey]);
      if (ym && ym !== targetMonth) return false;

      if (statusKey) {
        const st = String(r[statusKey] || '').trim();
        if (st && !st.includes('완료') && !st.includes('성공') && !st.includes('배송')) return false;
      }
      return true;
    });

    // 만약 1차 필터링으로 0건이면 필터 조건을 완화하여 전체 데이터 fallback
    let isFallback = false;
    if (filteredRows.length === 0) {
      filteredRows = receiptRows;
      isFallback = true;
    }

    const totalOrders = filteredRows.length;
    let totalQty = 0;

    const staffMap = {};
    const dailyMap = {};

    filteredRows.forEach(r => {
      const rawStaff = String(r[staffKey] || '미지정').trim();
      const staff = (!rawStaff || rawStaff.toLowerCase() === 'nan') ? '미지정' : rawStaff;
      const qty = qtyKey ? (Number(r[qtyKey]) || 1) : 1;
      const dateVal = this.formatDate(r[dateKey]);

      totalQty += qty;

      // 접수자별
      if (!staffMap[staff]) {
        staffMap[staff] = {
          staffName: staff,
          completedOrders: 0,
          completedQty: 0
        };
      }
      staffMap[staff].completedOrders += 1;
      staffMap[staff].completedQty += qty;

      // 일자별
      if (dateVal) {
        if (!dailyMap[dateVal]) {
          dailyMap[dateVal] = {
            date: dateVal,
            completedOrders: 0,
            completedQty: 0
          };
        }
        dailyMap[dateVal].completedOrders += 1;
        dailyMap[dateVal].completedQty += qty;
      }
    });

    const staffList = Object.values(staffMap);
    staffList.sort((a, b) => b.completedQty - a.completedQty || b.completedOrders - a.completedOrders || a.staffName.localeCompare(b.staffName, 'ko'));

    staffList.forEach((item, idx) => {
      item.rank = idx + 1;
      item.shareRate = totalQty > 0 ? Number(((item.completedQty / totalQty) * 100).toFixed(1)) : 0;
    });

    const dailyList = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const topStaff = staffList[0] || null;

    return {
      type: 'table_only',
      title: '3. 현재 달의 접수 수량 (기준: 접수자, 배송일, 완료)',
      targetMonth: isFallback ? '전체 기간' : targetMonth,
      kpis: [
        {
          label: isFallback ? '총 접수수량 (전체)' : '당월 총 완료 접수수량',
          value: `${totalQty.toLocaleString()}건`,
          isPositive: true,
          sub: isFallback ? '전체 데이터 기준' : `${targetMonth} 배송 완료 기준`
        },
        {
          label: '완료 주문건수',
          value: `${totalOrders.toLocaleString()}건`,
          sub: '전체 완료 레코드 합계'
        },
        {
          label: '활동 접수자 수',
          value: `${staffList.length}명`,
          sub: '접수 실적 보유자'
        },
        {
          label: '1위 접수자',
          value: topStaff ? topStaff.staffName : '-',
          sub: topStaff ? `${topStaff.completedQty.toLocaleString()}건 (${topStaff.shareRate}%)` : '내역 없음'
        }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'staffName', label: '접수자' },
        { key: 'completedQty', label: '완료 접수수량 (건)' },
        { key: 'completedOrders', label: '완료 주문건수' },
        { key: 'shareRate', label: '점유율 (%)' }
      ],
      data: staffList,
      subTitle: `📅 ${isFallback ? '전체 기간' : targetMonth} 일자별 완료 접수 현황`,
      subColumns: [
        { key: 'date', label: '배송일자' },
        { key: 'completedOrders', label: '완료 주문건수' },
        { key: 'completedQty', label: '완료 접수수량 (건)' }
      ],
      subData: dailyList
    };
  }
};

window.ReceptionCountModule = ReceptionCountModule;
