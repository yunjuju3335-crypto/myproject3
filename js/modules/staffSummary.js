/**
 * 5. 접수자 개인별 집계 모듈 (staffSummary.js)
 * 분석결과 3(접수 수량)과 4(오류)를 개인별로 정리
 * 표시방식: 모든 결과는 표(Table)로 렌더링
 */
const StaffSummaryModule = {
  id: 'staffSummary',
  name: '5. 상담원 실적 (3.접수 & 4.오류 표시 후 결과 도출)',
  description: '별도 첨부 없이 3. 상담원 접수와 4. 상담원 오류 데이터를 순차적으로 보여주고, 이를 교차 분석하여 최종 실적 결과를 보여주는 분석 창입니다.',
  icon: '🎯',

  execute(receiptRows, errorRows, perfRows, options = {}) {
    // 접수 데이터 분석 3 실행
    let recRes = null;
    if (window.ReceptionCountModule && receiptRows && receiptRows.length > 0) {
      try {
        recRes = window.ReceptionCountModule.execute(receiptRows, options);
      } catch (e) {
        console.warn('접수 분석 오류:', e);
      }
    }

    // 오류 데이터 분석 4 실행
    let errRes = null;
    if (window.ErrorAnalysisModule && errorRows && errorRows.length > 0) {
      try {
        errRes = window.ErrorAnalysisModule.execute(errorRows, options);
      } catch (e) {
        console.warn('오류 분석 오류:', e);
      }
    }

    // 만약 둘 다 없으면 에러
    if (!recRes && !errRes) {
      throw new Error("분석할 접수 또는 오류 데이터가 없습니다. 먼저 칼럼 1에서 [3. 접수 원본 엑셀]과 [4. 오류 원본 엑셀]을 업로드해주세요.");
    }

    const recMap = {};
    if (recRes && recRes.data) {
      recRes.data.forEach(item => {
        recMap[item.staffName] = item;
      });
    }

    const errMap = {};
    if (errRes && errRes.tables && errRes.tables[0]?.data) {
      errRes.tables[0].data.forEach(item => {
        errMap[item.staffName] = item;
      });
    }

    // 실적 맵
    const perfMap = {};
    if (perfRows && perfRows.length > 0) {
      const pSample = perfRows[0];
      const pKeys = Object.keys(pSample);
      const sKey = pKeys.find(k => ['상담원', '상담사', '접수자', '담당자', '직원', '사원', '성명', '이름'].some(c => k.includes(c))) || pKeys[0];
      const amtKey = pKeys.find(k => ['달성금액', '실적금액', '실적'].some(c => k.includes(c)));
      const rateKey = pKeys.find(k => ['달성률', '달성율', '달성비율'].some(c => k.includes(c)));

      perfRows.forEach(r => {
        const name = String(r[sKey] || '').trim();
        if (name) {
          perfMap[name] = {
            achieveAmount: amtKey ? (Number(r[amtKey]) || 0) : 0,
            achieveRate: rateKey ? (Number(r[rateKey]) || 0) : 0
          };
        }
      });
    }

    // 전체 직원 합집합
    const allStaff = Array.from(new Set([
      ...Object.keys(recMap),
      ...Object.keys(errMap),
      ...Object.keys(perfMap)
    ])).sort((a, b) => a.localeCompare(b, 'ko'));

    let totalCompletedQty = 0;
    let totalCustomerQty = 0;
    let totalParanQty = 0;
    let totalErrorCount = 0;
    let totalErrorCost = 0;

    const summaryList = allStaff.map(st => {
      const r = recMap[st] || {};
      const e = errMap[st] || {};
      const p = perfMap[st] || {};

      const cQty = r.completedQty || 0;
      const cOrders = r.completedOrders || 0;
      const custQty = r.customerQty !== undefined ? r.customerQty : cQty;
      const custOrders = r.customerOrders !== undefined ? r.customerOrders : cOrders;
      const pQty = r.paranQty !== undefined ? r.paranQty : 0;
      const pOrders = r.paranOrders !== undefined ? r.paranOrders : 0;

      const eCount = e.errorCount || 0;
      const eCost = e.totalCost || 0;
      const topErr = e.topErrorType || '없음(무결점)';

      const errorRate = cQty > 0 ? Number(((eCount / cQty) * 100).toFixed(2)) : (eCount > 0 ? 100.0 : 0.0);

      let grade = '✅ 양호';
      if (eCount === 0 && cQty > 0) {
        grade = '👑 최우수 (무오류)';
      } else if (errorRate <= 2.0) {
        grade = '🌟 우수';
      } else if (errorRate > 5.0) {
        grade = '⚠️ 관리주의';
      }

      totalCompletedQty += cQty;
      totalCustomerQty += custQty;
      totalParanQty += pQty;
      totalErrorCount += eCount;
      totalErrorCost += eCost;

      return {
        staffName: st,
        customerQty: custQty,
        customerOrders: custOrders,
        paranQty: pQty,
        paranOrders: pOrders,
        completedQty: cQty,
        completedOrders: cOrders,
        errorCount: eCount,
        errorRate: errorRate,
        totalCost: eCost,
        topErrorType: topErr,
        achieveAmount: p.achieveAmount || 0,
        achieveRate: p.achieveRate || 0,
        grade: grade
      };
    });

    summaryList.sort((a, b) => b.completedQty - a.completedQty || a.errorRate - b.errorRate || a.staffName.localeCompare(b.staffName, 'ko'));
    summaryList.forEach((item, idx) => { item.rank = idx + 1; });

    // [핵심] 체인팀 개인별 실적 (고객접수 vs 파란접수 분리) 최종 집계표 생성
    const chainTeamMembers = ['김숙정', '유혜미', '김경미'];
    const chainStaffData = summaryList.filter(s => chainTeamMembers.includes(s.staffName));

    let chainSummaryTable = null;
    let chainSummaryList = [];

    if (chainStaffData.length > 0) {
      const chainTotal = {
        rank: '합계',
        staffName: '체인팀 전체 합계',
        role: '팀 전체',
        customerQty: chainStaffData.reduce((acc, c) => acc + (c.customerQty || 0), 0),
        paranQty: chainStaffData.reduce((acc, c) => acc + (c.paranQty || 0), 0),
        completedQty: chainStaffData.reduce((acc, c) => acc + (c.completedQty || 0), 0),
        completedOrders: chainStaffData.reduce((acc, c) => acc + (c.completedOrders || 0), 0),
        errorCount: chainStaffData.reduce((acc, c) => acc + (c.errorCount || 0), 0),
        errorRate: 0,
        totalCost: chainStaffData.reduce((acc, c) => acc + (c.totalCost || 0), 0),
        topErrorType: '화원사 배송시간/주소',
        grade: '⭐ 체인팀 종합'
      };
      chainTotal.errorRate = chainTotal.completedQty > 0
        ? Number(((chainTotal.errorCount / chainTotal.completedQty) * 100).toFixed(2))
        : 0;

      chainSummaryList = [
        ...chainStaffData.map((s, i) => ({
          rank: i + 1,
          ...s,
          role: s.staffName === '김숙정' ? '팀장' : '팀원'
        })),
        chainTotal
      ];

      chainSummaryTable = {
        title: '🎯 [체인팀 전용] 개인별 실적 최종 집계표 (고객접수 vs 파란접수 분리 집계)',
        columns: [
          { key: 'rank', label: '순위' },
          { key: 'staffName', label: '상담원명' },
          { key: 'role', label: '직책' },
          { key: 'customerQty', label: '고객접수 건 (수량)' },
          { key: 'paranQty', label: '파란 접수건 (수량)' },
          { key: 'completedQty', label: '총 완료 접수수량 (건)' },
          { key: 'completedOrders', label: '완료 주문건수' },
          { key: 'errorCount', label: '오류건수 (건)' },
          { key: 'errorRate', label: '오류율 (%)' },
          { key: 'totalCost', label: '총 실수금액 (원)' },
          { key: 'grade', label: '실적 평가' }
        ],
        data: chainSummaryList
      };
    }

    const avgErrorRate = totalCompletedQty > 0 ? Number(((totalErrorCount / totalCompletedQty) * 100).toFixed(2)) : 0;
    const targetMonth = recRes?.targetMonth || errRes?.targetMonth || new Date().toISOString().slice(0, 7);

    return {
      id: 'staffSummary',
      type: 'table_only',
      title: '5. 상담원 실적 (3.상담원 접수와 4.상담원 오류 기반 교차 분석 결과)',
      targetMonth: targetMonth,
      recRes: recRes,
      errRes: errRes,
      chainSummaryTable: chainSummaryTable,
      kpis: [
        {
          label: '총 분석 대상 상담원',
          value: `${summaryList.length}명`,
          sub: '3.접수 및 4.오류 대상'
        },
        {
          label: '전체 완료 접수수량',
          value: `${totalCompletedQty.toLocaleString()}건`,
          isPositive: true,
          sub: `고객 ${totalCustomerQty}건 / 파란 ${totalParanQty}건`
        },
        {
          label: '체인팀 총 접수수량',
          value: chainSummaryList.length > 0 ? `${chainSummaryList[chainSummaryList.length - 1].completedQty}건` : '-',
          sub: chainSummaryList.length > 0 ? `고객 ${chainSummaryList[chainSummaryList.length - 1].customerQty}건 / 파란 ${chainSummaryList[chainSummaryList.length - 1].paranQty}건` : '체인팀 내역'
        },
        {
          label: '전체 오류 발생 건수',
          value: `${totalErrorCount.toLocaleString()}건`,
          isPositive: false,
          sub: '4.상담원 오류 합산'
        },
        {
          label: '전체 평균 오류율',
          value: `${avgErrorRate}%`,
          sub: '오류건수 ÷ 접수수량'
        },
        {
          label: '총 실수금액 (손실액)',
          value: `${totalErrorCost.toLocaleString()}원`,
          sub: '전체 손실액 합산'
        }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'staffName', label: '상담원명' },
        { key: 'customerQty', label: '고객접수 건 (건)' },
        { key: 'paranQty', label: '파란 접수건 (건)' },
        { key: 'completedQty', label: '총 접수수량 (건)' },
        { key: 'completedOrders', label: '완료 주문건수' },
        { key: 'errorCount', label: '오류건수 (건)' },
        { key: 'errorRate', label: '오류율 (%)' },
        { key: 'totalCost', label: '총 실수금액 (원)' },
        { key: 'topErrorType', label: '주요 실수유형' },
        { key: 'grade', label: '종합 실적 평가' }
      ],
      data: summaryList,
      subTitle: chainSummaryTable ? chainSummaryTable.title : null,
      subColumns: chainSummaryTable ? chainSummaryTable.columns : null,
      subData: chainSummaryTable ? chainSummaryTable.data : null
    };
  }
};

window.StaffSummaryModule = StaffSummaryModule;
