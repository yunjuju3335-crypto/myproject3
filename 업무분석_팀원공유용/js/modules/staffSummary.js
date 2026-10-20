/**
 * 5. 접수자 개인별 집계 모듈 (staffSummary.js)
 * 분석결과 3(접수 수량)과 4(오류)를 개인별로 정리
 * 표시방식: 모든 결과는 표(Table)로 렌더링
 */
const StaffSummaryModule = {
  id: 'staffSummary',
  name: '5. 접수자 개인별 집계 (분석결과 3.4를 개인별로 정리)',
  description: '접수 완료 수량(3번)과 오류 내역(4번)을 접수자 개인별로 교차 집계하여 종합 표(Table)로 표시합니다.',
  icon: '👤',

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
      const sKey = pKeys.find(k => ['접수자', '담당자', '직원', '성명', '이름'].some(c => k.includes(c))) || pKeys[0];
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
    let totalErrorCount = 0;
    let totalErrorCost = 0;

    const summaryList = allStaff.map(st => {
      const r = recMap[st] || {};
      const e = errMap[st] || {};
      const p = perfMap[st] || {};

      const cQty = r.completedQty || 0;
      const cOrders = r.completedOrders || 0;
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
      totalErrorCount += eCount;
      totalErrorCost += eCost;

      return {
        staffName: st,
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

    const avgErrorRate = totalCompletedQty > 0 ? Number(((totalErrorCount / totalCompletedQty) * 100).toFixed(2)) : 0;
    const targetMonth = recRes?.targetMonth || errRes?.targetMonth || new Date().toISOString().slice(0, 7);

    return {
      type: 'table_only',
      title: '5. 접수자 개인별 집계 (분석결과 3. 접수수량과 4. 오류를 개인별로 정리)',
      targetMonth: targetMonth,
      kpis: [
        {
          label: '총 분석 대상 인원',
          value: `${summaryList.length}명`,
          sub: '접수 및 오류 담당자'
        },
        {
          label: '전체 완료 접수수량',
          value: `${totalCompletedQty.toLocaleString()}건`,
          isPositive: true,
          sub: '3번 분석 합산'
        },
        {
          label: '전체 오류 발생 건수',
          value: `${totalErrorCount.toLocaleString()}건`,
          isPositive: false,
          sub: '4번 분석 합산'
        },
        {
          label: '전체 평균 오류율',
          value: `${avgErrorRate}%`,
          sub: '오류건수 ÷ 완료수량'
        },
        {
          label: '총 실수금액 (손실액)',
          value: `${totalErrorCost.toLocaleString()}원`,
          sub: '전체 발생 비용 합계'
        }
      ],
      columns: [
        { key: 'rank', label: '순위' },
        { key: 'staffName', label: '접수자' },
        { key: 'completedQty', label: '완료 접수수량 (건)' },
        { key: 'completedOrders', label: '완료 주문건수' },
        { key: 'errorCount', label: '오류건수 (건)' },
        { key: 'errorRate', label: '오류율 (%)' },
        { key: 'totalCost', label: '총 실수금액 (원)' },
        { key: 'topErrorType', label: '주요 실수유형' },
        { key: 'achieveAmount', label: '실적 달성금액 (원)' },
        { key: 'achieveRate', label: '달성률 (%)' },
        { key: 'grade', label: '종합 평가' }
      ],
      data: summaryList
    };
  }
};

window.StaffSummaryModule = StaffSummaryModule;
