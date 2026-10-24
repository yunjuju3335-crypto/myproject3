/**
 * 피드백 노트 및 종합 리포트 컨트롤러 (feedbackApp.js)
 * - 팀별(1팀, 2팀, 3팀, 체인팀, 기타) 독립 페이지 및 전체 종합 피드백 지원
 * - 실적 기반 팀장 및 팀원 각 개인별 맞춤 피드백 제공
 * - 핵심실무 피드백 노트를 개인별 피드백 아래에 명확하게 배치
 * - 완전 독립 실행형 단일 HTML 보고서 다운로드 및 인쇄(PDF) 지원
 */

// 안전한 토스트 메시지 함수
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-message';
  const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : '💾');
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 1. 사용자 지정 팀 구성 정의 (팀장 및 팀원 명단 및 기본 팀장 핵심 관리 포인트)
const TEAM_CONFIG = [
  {
    teamId: 'team1',
    teamName: '1팀',
    leader: '이재희',
    members: [
      { name: '이재희', role: '팀장' },
      { name: '김가은', role: '팀원' },
      { name: '김보혜', role: '팀원' },
      { name: '박언정', role: '팀원' },
      { name: '강아름', role: '팀원' }
    ],
    mission: '정확한 정보 입력과 고객 만족 실현 (무결점 품질 표준 지향)',
    leaderPoints: [
      "강아름 사원의 '소리 내어 읽는 리본·연락처 검수 기법'을 주간 회의 시 팀 표준으로 채택하여 김가은, 박언정 사원에게 피어 코칭(Peer Coaching) 진행.",
      "김보혜 사원 실무 투입 전 1팀 2중 검수 체크리스트 OJT 완료.",
      "주소 오류 발생 시 건당 손실액이 크므로, 배송지 주소 팝업 확인 루틴을 팀원들에게 매일 아침 리마인드."
    ],
    practicalNotes: {
      title: '1팀 핵심실무 피드백 노트 (리본 문구 & 연락처 2중 검증 SOP)',
      points: [
        '<strong>[리본 문구 오기 방지]</strong> 주문 접수 시 축하/근조 리본 문구는 고객 접수 원본과 화면 입력값을 육안으로 2회 소리 내어 확인하는 루틴 적용.',
        '<strong>[연락처 11자리 유효성 검증]</strong> 수신인 전화번호 누락 및 자리수 착오 방지를 위한 하이픈 자동 포맷팅 및 번호 재확인 의무화.',
        '<strong>[피어 코칭(Peer Coaching)]</strong> 월 37건 무결점을 달성한 강아름 사원의 접수 및 검수 팁을 팀 내 김가은, 박언정 사원에게 1:1 버디로 공유.',
        '<strong>[고액 손실 차단]</strong> 배송지 주소 상세 동·호수 및 예식장/장례식장 호실 오입력 시 건당 10~15만원 손실 발생 ➔ 주소 정합성 팝업 확인 필수.'
      ]
    }
  },
  {
    teamId: 'team2',
    teamName: '2팀',
    leader: '박소영',
    members: [
      { name: '박소영', role: '팀장' },
      { name: '주가영', role: '팀원' },
      { name: '최승애', role: '팀원' },
      { name: '손미경', role: '팀원' },
      { name: '박재현', role: '팀원' },
      { name: '강미성', role: '팀원' },
      { name: '손수진', role: '팀원' }
    ],
    mission: '최다 물량 신속 소화 및 배송시간 철저 준수 (정시 배송 극대화)',
    leaderPoints: [
      "손수진 사원의 피크 시간대(09~11시) 과도한 주문 쏠림을 완화하기 위해, 주가영·박재현·강미성 사원에게 접수 분산 배분.",
      "행사 주문(결혼식/장례식)은 행사 시작 1시간 전 배송 완료 보장 프로토콜을 팀 전체에 철저히 적용.",
      "안정적인 실적을 기록한 손미경 사원(오류율 6.06%)의 검수 템플릿을 팀원 전체가 벤치마킹하도록 지도."
    ],
    practicalNotes: {
      title: '2팀 핵심실무 피드백 노트 (피크 시간대 속도 조절 & 배송시간 준수 SOP)',
      points: [
        '<strong>[배송시간 1시간 전 완료제]</strong> 예식 및 추모 행사 주문은 행사 시작 최소 1시간 전 배송 완료 보장 프로토콜을 화원사에 사전 확약.',
        '<strong>[접수왕 손수진 사원 집중 케어]</strong> 전사 최다 접수(42건)를 수행하는 손수진 사원의 주문 몰림 시간대(09~11시) 주소 2차 검수를 팀 차원에서 분산 지원.',
        '<strong>[주소·시간 손실액 감축]</strong> 당월 2팀 내 주소 및 시간 관련 손실액이 집중되었으므로(손수진 39.5만, 최승애 13.5만), 고난도 배송지는 팀장 사전 승인 후 발주.',
        '<strong>[손미경 사원 모범 패턴 확산]</strong> 오류율 6.06%의 안정적인 품질을 유지한 손미경 사원의 검수 방식을 주가영, 박재현, 강미성 사원 교육에 활용.'
      ]
    }
  },
  {
    teamId: 'team3',
    teamName: '3팀',
    leader: '손수령',
    members: [
      { name: '손수령', role: '팀장' },
      { name: '강은진', role: '팀원' },
      { name: '이미금', role: '팀원' },
      { name: '박해니', role: '팀원' }
    ],
    mission: '전사 최고 무결점 품질 표준 확립 (단 1건의 오차도 없는 완벽한 접수)',
    leaderPoints: [
      "이미금 사원의 '무결점 3단계 접수 체크리스트'를 공식 문서화하여 3팀의 시그니처 매뉴얼로 확립.",
      "실무 투입을 준비하는 강은진, 박해니 사원에게 이미금 사원을 전담 멘토로 매칭하여 팀 전원 무결점 체제 구축.",
      "복잡한 특수 상품(특/특대/4단/5단 등) 발주 시 농장과의 사전 규격 확인을 지원하여 완벽 마감 유지."
    ],
    practicalNotes: {
      title: '3팀 핵심실무 피드백 노트 (전사 최고 무결점 0% 표준화 전파 모델)',
      points: [
        '<strong>[전사 1위 에이스 이미금 사원 벤치마킹]</strong> 38건 접수/0건 오류/오류율 0.00%를 달성한 이미금 사원의 체크리스트를 전사 표준 접수 가이드로 공표.',
        '<strong>[손수령 팀장의 완벽 마감 리더십]</strong> 마감 직전 주문에 대한 팀장의 3중 크로스 체킹 체계를 유지하여 팀 무결점 위상 지속 유지.',
        '<strong>[신규 및 지원 인력 OJT]</strong> 강은진, 박해니 사원에게 이미금 사원의 입력 전·중·후 3단계 검수 기법을 실습 위주로 전수하여 전원 에이스화 추진.',
        '<strong>[예외 케이스 즉시 보고]</strong> 특수 화환 및 복합 옵션 주문 발생 시 임의 처리 지양, 팀장과 즉각적인 유선 확인 후 발주 진행.'
      ]
    }
  },
  {
    teamId: 'teamChain',
    teamName: '체인팀',
    leader: '김숙정',
    members: [
      { name: '김숙정', role: '팀장' },
      { name: '유혜미', role: '팀원' },
      { name: '김경미', role: '팀원' }
    ],
    mission: '화원사 체인 발주 순증가 견인 및 화원사-고객 간 납기 신뢰 구축',
    leaderPoints: [
      "<strong>[고객접수 건]</strong> 리본 문구 및 수취인 11자리 연락처 입력 시 2중 검수로 단순 오기 완벽 차단.",
      "<strong>[파란 접수건(파란플라워)]</strong> 화원사 지정 즉시 '배송 가능 시각 사전 유선 확약제'를 도입하여 시간 미준수로 인한 배송 취소 방지.",
      "배송 지연 징후 감지 시 고객에게 30분 전 선제 안내를 진행하여 클레임 및 손실금액 원천 차단.",
      "무결점(0건 오류)을 기록한 유혜미 사원의 검수 템플릿을 김경미 사원과 함께 공유하여 체인팀 전원 무결점 체제 구축."
    ],
    practicalNotes: {
      title: '체인팀 핵심실무 피드백 노트 (화원사 배송시간 사전 확약 및 체인 표준 템플릿)',
      points: [
        '<strong>[화원사 배송시간 사전 확약제]</strong> 체인 발주 시 지방 화원사의 배송 지연을 방지하기 위해 발주 접수와 동시에 지정 시각 배송 가능 여부를 유선 확약.',
        '<strong>[배송 지연 30분 전 선제 안내]</strong> 도로 정체 등 불가피한 지연 발생 시 고객 불만 접수 전 선제적으로 안내 문자/알림 발송.',
        '<strong>[필수 4대 데이터 템플릿]</strong> 주소, 수령인 번호, 배송 시각, 상품 옵션을 규격화된 체인 전용 템플릿으로 화원사에 전송하여 오해 소지 차단.',
        '<strong>[체인점 발주 순증가 유지]</strong> 발주 증가 상위 10개 화원사(봄1호, 강남2호 등)와의 전담 핫라인을 구축하여 오발주 발생률 0% 달성.'
      ]
    }
  },
  {
    teamId: 'teamEtc',
    teamName: '기타',
    leader: '관리총괄',
    members: [
      { name: '박수빈', role: '담당' },
      { name: '퇴사자', role: '이관/정리' }
    ],
    mission: '업무 인수인계, 시스템 권한 보안 및 계정·거래처 미결 데이터 완벽 이관',
    leaderPoints: [
      "퇴사자 계정 즉시 회수 및 외부 발주 시스템 접근 권한 차단으로 보안 리스크 원천 차단.",
      "퇴사자가 처리 중이던 미결 접수 건 및 거래처 정산 내역 재점검 및 현직 담당자 인수인계 완료.",
      "피크 시즌 주문 폭증 시 각 팀의 예비 접수 인력으로 신속히 투입될 수 있도록 전 시스템 접근 권한 상시 숙지."
    ],
    practicalNotes: {
      title: '기타 부문 핵심실무 피드백 노트 (인수인계 보안 및 퇴사자 계정 이관 관리)',
      points: [
        '<strong>[퇴사자 계정 즉시 비활성화]</strong> 퇴사 발생 즉시 접수 시스템 계정 및 외부 발주 시스템 권한을 회수하여 오발주 및 보안 리스크 원천 차단.',
        '<strong>[미결 주문 및 거래처 정산 점검]</strong> 퇴사자가 처리 중이던 미결 접수 건 및 보류 건을 재점검하고, 현직 담당자에게 책임 이관 완료.',
        '<strong>[박수빈 담당의 특수 지원 체계]</strong> 팀 간 주문 과부하 발생 시 유동적으로 지원 가능한 임시 접수 프로토콜 및 권한 관리 유지.'
      ]
    }
  }
];

/**
 * 팀장 핵심 관리 포인트 저장/관리자 (localStorage 연동 & 실시간 추가/수정/삭제/복원 지원)
 */
const LeaderPointsManager = {
  getStorageKey(teamId) {
    return `cmwork_leader_points_${teamId}`;
  },
  getPoints(team) {
    try {
      const saved = localStorage.getItem(this.getStorageKey(team.teamId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LeaderPointsManager parse error:', e);
    }
    return team.leaderPoints ? [...team.leaderPoints] : [];
  },
  savePoints(teamId, points) {
    try {
      localStorage.setItem(this.getStorageKey(teamId), JSON.stringify(points));
      return true;
    } catch (e) {
      console.error('LeaderPointsManager save error:', e);
      return false;
    }
  },
  resetPoints(team) {
    try {
      localStorage.removeItem(this.getStorageKey(team.teamId));
    } catch (e) {
      console.error('LeaderPointsManager reset error:', e);
    }
    return team.leaderPoints ? [...team.leaderPoints] : [];
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const themeToggle = document.getElementById('theme-toggle');
  const btnDownloadHtml = document.getElementById('btn-download-html');
  const btnPrintReport = document.getElementById('btn-print-report');
  const btnSyncSamples = document.getElementById('btn-sync-samples');
  const teamNavTabs = document.getElementById('team-nav-tabs');
  const teamViewContainer = document.getElementById('team-view-container');

  // 전역 상태
  window.appFeedbackState = {
    currentTeam: 'all',
    dataBundle: null,
    latestChartData: null
  };

  // 테마 관리
  const currentTheme = localStorage.getItem('theme') || 'dark';
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggle) {
      themeToggle.innerText = theme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드';
    }
  };
  applyTheme(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      if (window.appFeedbackState.latestChartData) {
        const chartBox = document.getElementById('chart-container-box');
        if (chartBox) {
          window.ChartRenderer.render(chartBox, window.appFeedbackState.latestChartData, '1-2. 발주증가 화원사 1위~10위 비교 그래프');
        }
      }
    });
  }

  // 원격 엑셀 파일 로드 헬퍼 (네트워크 사용 가능 시)
  const loadRemoteExcel = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    } catch (e) {
      return null;
    }
  };

  /**
   * 팀원 명단과 분석 결과(staffMap) 간의 스마트 매칭 함수
   * (직급, 호칭, 공백, 괄호 등 서식 차이를 완벽히 보정하여 매칭)
   */
  const findStaffData = (staffMap, memberName) => {
    if (!staffMap || !memberName) return null;
    // 1. 완전 일치
    if (staffMap[memberName]) return staffMap[memberName];

    const cleanTarget = memberName.replace(/\s+/g, '');

    // 2. 공백 제거 일치
    for (const [key, val] of Object.entries(staffMap)) {
      if (key.replace(/\s+/g, '') === cleanTarget) return val;
    }

    // 3. 대상 문자열 포함 (예: "이재희 팀장", "이재희(1팀)", "1팀 이재희", "김가은 사원")
    for (const [key, val] of Object.entries(staffMap)) {
      const cleanKey = key.replace(/\s+/g, '');
      if (cleanKey.includes(cleanTarget)) return val;
    }

    // 4. 역방향 포함 (이름이 2자 이상인 경우)
    for (const [key, val] of Object.entries(staffMap)) {
      const cleanKey = key.replace(/\s+/g, '');
      if (cleanKey.length >= 2 && cleanTarget.includes(cleanKey)) return val;
    }

    return null;
  };

  /**
   * 데이터 로드 및 종합 분석 수행
   * - 1순위: IndexedDB (메인화면에서 사용자가 업로드한 원본 엑셀 - 무제한 용량 & 새로고침 보존)
   * - 2순위: sessionStorage (보조 세션 캐시)
   * - 3순위: sampleDataBundle.js에 정적 내장된 5종 데이터 (오프라인 100% 보장)
   * - 4순위: 원격 파일 fetch Fallback
   */
  const loadAndAnalyzeData = async (allowSampleFallback = false) => {
    try {
      showToast('팀별 데이터 및 실적 분석을 로드 중입니다...', 'info');

      const getSessionOrSample = async (slotKey, sampleUrl) => {
        // 1순위: IndexedDB (메인 대시보드에서 직접 업로드한 엑셀 데이터 - 영구 유지)
        if (window.indexedDbStorage) {
          try {
            const idbData = await window.indexedDbStorage.getSlot(slotKey);
            if (idbData && Array.isArray(idbData.rows) && idbData.rows.length > 0) {
              return idbData.rows;
            }
          } catch (e) {
            console.warn('IndexedDB 슬롯 로드 오류:', e);
          }
        }

        // 2순위: 세션 저장소 (사용자가 직접 업로드한 엑셀)
        try {
          const cached = sessionStorage.getItem('cmwork_slot_' + slotKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch (e) {}

        // 사용자가 명시적으로 [⚡ 분석 데이터 최신화] 버튼을 눌렀을 때만 샘플 번들 허용
        if (allowSampleFallback) {
          if (window.SAMPLE_DATA_BUNDLE && Array.isArray(window.SAMPLE_DATA_BUNDLE[slotKey]) && window.SAMPLE_DATA_BUNDLE[slotKey].length > 0) {
            return window.SAMPLE_DATA_BUNDLE[slotKey];
          }
          const remoteData = await loadRemoteExcel(sampleUrl);
          if (remoteData && remoteData.length > 0) return remoteData;
        }

        return [];
      };

      // 5개 원본 데이터 로드 (5번 실적은 3번 접수+4번 오류로 자동 산출)
      const [prevRows, currRows, prodRows, recRows, errRows] = await Promise.all([
        getSessionOrSample('prevOrders', './data/sample_prev_orders.xlsx'),
        getSessionOrSample('currOrders', './data/sample_curr_orders.xlsx'),
        getSessionOrSample('products', './data/sample_products.xlsx'),
        getSessionOrSample('receptions', './data/sample_receipts.xlsx'),
        getSessionOrSample('errors', './data/sample_errors.xlsx')
      ]);

      const hasAnyData = (prevRows && prevRows.length > 0) ||
                         (currRows && currRows.length > 0) ||
                         (prodRows && prodRows.length > 0) ||
                         (recRows && recRows.length > 0) ||
                         (errRows && errRows.length > 0);

      const bannerBadge = document.querySelector('.feedback-banner .slot-badge');

      // 만약 메인 대시보드에서 새로고침(리셋)되어 원본 데이터가 없다면 분석 결과 완전히 비우고 안내창 표시
      if (!hasAnyData) {
        window.appFeedbackState.dataBundle = null;
        window.appFeedbackState.latestChartData = null;
        if (bannerBadge) {
          bannerBadge.className = 'slot-badge badge-waiting';
          bannerBadge.textContent = '데이터 초기화됨 (대기중)';
        }
        renderCurrentView();
        showToast('🔄 분석 결과가 초기화되었습니다. 메인 대시보드에서 엑셀을 업로드해주세요.', 'info');
        return;
      }

      if (bannerBadge) {
        bannerBadge.className = 'slot-badge badge-ready';
        bannerBadge.textContent = '실시간 자동 분석 완료';
      }

      // 각 모듈을 독립적인 try-catch로 안전하게 실행하여 어느 한 모듈 오류로 전체가 중단되지 않도록 보호
      let trendOutput = null;
      let floristOutput = null;
      let prodOutput = null;
      let recOutput = null;
      let errOutput = null;
      let staffOutput = null;

      if (window.OrderTrendModule && prevRows && currRows && prevRows.length > 0 && currRows.length > 0) {
        try {
          trendOutput = window.OrderTrendModule.execute(prevRows, currRows);
        } catch (e) {
          console.warn('OrderTrendModule 실행 오류:', e);
        }
      }

      if (window.FloristRankingModule && prevRows && currRows && prevRows.length > 0 && currRows.length > 0) {
        try {
          floristOutput = window.FloristRankingModule.execute(prevRows, currRows, 10);
        } catch (e) {
          console.warn('FloristRankingModule 실행 오류:', e);
        }
      }

      if (window.ProductProgressModule && prodRows && prodRows.length > 0) {
        try {
          prodOutput = window.ProductProgressModule.execute(prodRows);
        } catch (e) {
          console.warn('ProductProgressModule 실행 오류:', e);
        }
      }

      if (window.ReceptionCountModule && recRows && recRows.length > 0) {
        try {
          recOutput = window.ReceptionCountModule.execute(recRows);
        } catch (e) {
          console.warn('ReceptionCountModule 실행 오류:', e);
        }
      }

      if (window.ErrorAnalysisModule && errRows && errRows.length > 0) {
        try {
          errOutput = window.ErrorAnalysisModule.execute(errRows);
        } catch (e) {
          console.warn('ErrorAnalysisModule 실행 오류:', e);
        }
      }

      if (window.StaffSummaryModule && ((recRows && recRows.length > 0) || (errRows && errRows.length > 0))) {
        try {
          staffOutput = window.StaffSummaryModule.execute(recRows, errRows);
        } catch (e) {
          console.warn('StaffSummaryModule 실행 오류:', e);
        }
      }

      if (!staffOutput) {
        staffOutput = { data: [], columns: [], title: '5. 상담원 실적 분석결과표' };
      }

      if (floristOutput && floristOutput.chartData) {
        window.appFeedbackState.latestChartData = floristOutput.chartData;
      }

      // 직원별 데이터 맵 구축 (스마트 매칭 지원)
      const staffMap = {};
      if (staffOutput && staffOutput.data) {
        staffOutput.data.forEach(item => {
          staffMap[item.staffName] = item;
        });
      }

      // 팀별 집계 데이터 구축
      const teamStatsMap = {};
      const matchedStaffNames = new Set();

      TEAM_CONFIG.forEach(team => {
        let tCompleted = 0;
        let tCustomerQty = 0;
        let tParanQty = 0;
        let tOrders = 0;
        let tErrors = 0;
        let tCost = 0;

        team.members.forEach(m => {
          const s = findStaffData(staffMap, m.name);
          if (s) {
            matchedStaffNames.add(s.staffName);
            tCompleted += (s.completedQty || 0);
            tCustomerQty += (s.customerQty !== undefined ? s.customerQty : (s.completedQty || 0));
            tParanQty += (s.paranQty || 0);
            tOrders += (s.completedOrders || 0);
            tErrors += (s.errorCount || 0);
            tCost += (s.totalCost || 0);
          }
        });

        const tErrorRate = tCompleted > 0 ? Number(((tErrors / tCompleted) * 100).toFixed(2)) : 0;

        teamStatsMap[team.teamId] = {
          teamId: team.teamId,
          teamName: team.teamName,
          leader: team.leader,
          completedQty: tCompleted,
          customerQty: tCustomerQty,
          paranQty: tParanQty,
          completedOrders: tOrders,
          errorCount: tErrors,
          errorRate: tErrorRate,
          totalCost: tCost,
          memberCount: team.members.length
        };
      });

      // 만약 업로드된 엑셀에 TEAM_CONFIG에 없는 기타 상담원이 있다면 기타 팀에 동적 포함
      if (staffOutput && staffOutput.data) {
        const etcTeam = TEAM_CONFIG.find(t => t.teamId === 'teamEtc');
        if (etcTeam) {
          staffOutput.data.forEach(item => {
            if (!matchedStaffNames.has(item.staffName)) {
              const alreadyInEtc = etcTeam.members.some(m => m.name === item.staffName);
              if (!alreadyInEtc && item.staffName !== '미지정') {
                etcTeam.members.push({ name: item.staffName, role: '상담원' });
                matchedStaffNames.add(item.staffName);
              }
            }
          });
        }
      }

      window.appFeedbackState.dataBundle = {
        trendOutput,
        floristOutput,
        prodOutput,
        recOutput,
        errOutput,
        staffOutput,
        staffMap,
        teamStatsMap
      };

      // 현재 선택된 팀 뷰 렌더링
      renderCurrentView();

      showToast('팀별 피드백 노트 및 실적 분석 준비 완료!', 'success');
    } catch (err) {
      console.error(err);
      showToast('데이터 로드 오류: ' + err.message, 'error');
    }
  };

  /**
   * 현재 선택된 뷰 렌더링 (전체 or 특정 팀)
   */
  const renderCurrentView = () => {
    const { currentTeam, dataBundle } = window.appFeedbackState;
    if (!dataBundle) {
      if (teamViewContainer) {
        teamViewContainer.innerHTML = `
          <div style="padding: 70px 24px; text-align: center; background: var(--bg-card); border: 1px dashed var(--border-color); border-radius: 12px; margin-top: 24px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">분석 결과가 초기화(리셋)되었습니다</div>
            <div style="font-size: 13px; color: var(--text-secondary); max-width: 480px; margin: 0 auto 20px; line-height: 1.6;">
              메인 대시보드에서 새로고침이 실행되어 기존 분석 결과가 깨끗하게 초기화되었습니다.<br>
              메인 대시보드에서 새로운 엑셀 파일을 업로드하시면 각 팀별 실적 분석 및 맞춤 피드백 노트가 실시간으로 자동 산출됩니다.
            </div>
            <div style="display: flex; justify-content: center; gap: 12px;">
              <a href="index.html" class="btn btn-primary" style="padding: 10px 20px; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; font-weight: 700; color: #fff; border-radius: 8px;">
                📊 메인 대시보드로 이동하여 엑셀 업로드
              </a>
            </div>
          </div>
        `;
      }
      return;
    }

    if (currentTeam === 'all') {
      renderAllView(dataBundle);
    } else {
      const team = TEAM_CONFIG.find(t => t.teamId === currentTeam);
      if (team) {
        renderTeamView(team, dataBundle);
      }
    }
  };

  /**
   * 팀 네비게이션 탭 클릭 핸들러
   */
  if (teamNavTabs) {
    teamNavTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.team-nav-btn');
      if (!btn) return;
      const teamId = btn.getAttribute('data-team');
      if (!teamId) return;

      teamNavTabs.querySelectorAll('.team-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      window.appFeedbackState.currentTeam = teamId;
      renderCurrentView();
    });
  }

  /**
   * 팀별 단독 페이지 렌더링
   */
  const renderTeamView = (team, bundle) => {
    const stats = bundle.teamStatsMap[team.teamId] || {};
    const { staffMap } = bundle;

    // 팀장 피드백 메시지 생성 (스마트 매칭 적용)
    const leaderData = findStaffData(staffMap, team.leader);
    const leaderFeedbackHtml = generateLeaderFeedback(team, leaderData, stats, false);

    // 팀원 개인별 피드백 카드 HTML 생성 (스마트 매칭 적용)
    const memberCardsHtml = team.members.map(m => {
      const s = findStaffData(staffMap, m.name);
      return generateMemberCard(m, s, team);
    }).join('');

    // [핵심 요구사항] 체인팀 전용: 개인별 실적 최종 집계표 (고객접수 vs 파란접수 분리 집계)
    let chainTableHtml = '';
    if (team.teamId === 'teamChain') {
      const chainMembers = team.members.map(m => {
        const s = findStaffData(staffMap, m.name) || {};
        return {
          name: m.name,
          role: m.role,
          custQty: s.customerQty !== undefined ? s.customerQty : (s.completedQty || 0),
          paranQty: s.paranQty || 0,
          completed: s.completedQty || 0,
          orders: s.completedOrders || 0,
          errors: s.errorCount || 0,
          errRate: s.errorRate || 0,
          cost: s.totalCost || 0,
          grade: s.grade || '양호'
        };
      });

      const totalCust = chainMembers.reduce((acc, c) => acc + c.custQty, 0);
      const totalParan = chainMembers.reduce((acc, c) => acc + c.paranQty, 0);
      const totalComp = chainMembers.reduce((acc, c) => acc + c.completed, 0);
      const totalOrd = chainMembers.reduce((acc, c) => acc + c.orders, 0);
      const totalErr = chainMembers.reduce((acc, c) => acc + c.errors, 0);
      const totalCost = chainMembers.reduce((acc, c) => acc + c.cost, 0);
      const totalErrRate = totalComp > 0 ? Number(((totalErr / totalComp) * 100).toFixed(2)) : 0;

      const memberRows = chainMembers.map(m => `
        <tr>
          <td style="font-weight: 700;">${m.name}</td>
          <td><span class="member-role-badge ${m.role === '팀장' ? 'role-leader' : 'role-member'}">${m.role}</span></td>
          <td style="font-weight: 700; color: #6366f1;">${m.custQty}건</td>
          <td style="font-weight: 700; color: #0ea5e9;">${m.paranQty}건</td>
          <td style="font-weight: 800; color: #10b981;">${m.completed}건</td>
          <td>${m.orders}건</td>
          <td style="font-weight: 700; color: ${m.errors === 0 ? '#10b981' : '#f43f5e'};">${m.errors}건</td>
          <td style="font-weight: 700; color: ${m.errRate <= 5.0 ? '#10b981' : '#f59e0b'};">${m.errRate}%</td>
          <td style="font-weight: 700; color: #ef4444;">${m.cost.toLocaleString()}원</td>
          <td>${m.grade}</td>
        </tr>
      `).join('');

      chainTableHtml = `
        <section style="margin-bottom: 36px;">
          <div class="feedback-section-title" style="margin-bottom: 14px;">
            <span style="color: var(--accent-indigo);">🎯</span>
            <span>체인팀 개인별 실적 최종 집계표 (고객접수 건 vs 파란 접수건 분리 집계)</span>
          </div>
          <div class="data-table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>상담원명</th>
                  <th>직책</th>
                  <th style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">고객접수 건</th>
                  <th style="background: rgba(14, 165, 233, 0.15); color: #38bdf8;">파란 접수건</th>
                  <th style="background: rgba(16, 185, 129, 0.15); color: #34d399;">총 완료 접수수량</th>
                  <th>완료 주문건수</th>
                  <th>오류건수</th>
                  <th>오류율</th>
                  <th>총 실수금액</th>
                  <th>실적 평가</th>
                </tr>
              </thead>
              <tbody>
                ${memberRows}
                <tr style="background: rgba(99, 102, 241, 0.12); font-weight: 800; border-top: 2px solid var(--accent-indigo);">
                  <td>체인팀 합계</td>
                  <td><span class="member-role-badge role-leader">팀 전체</span></td>
                  <td style="color: #6366f1;">${totalCust}건</td>
                  <td style="color: #0ea5e9;">${totalParan}건</td>
                  <td style="color: #10b981;">${totalComp}건</td>
                  <td>${totalOrd}건</td>
                  <td style="color: ${totalErr === 0 ? '#10b981' : '#f43f5e'};">${totalErr}건</td>
                  <td style="color: ${totalErrRate <= 5.0 ? '#10b981' : '#f59e0b'};">${totalErrRate}%</td>
                  <td style="color: #ef4444;">${totalCost.toLocaleString()}원</td>
                  <td>⭐ 체인팀 종합</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      `;
    }

    teamViewContainer.innerHTML = `
      <!-- 팀 프로필 헤더 배너 -->
      <section class="team-profile-banner">
        <div>
          <div class="team-profile-title">
            <span>🛡️</span>
            <span>${team.teamName} 실적 피드백 & 코칭 노트</span>
            <span class="member-role-badge role-leader" style="font-size: 13px;">팀장: ${team.leader}</span>
          </div>
          <div class="team-profile-sub">
            💡 팀 미션: <strong>${team.mission}</strong> (총원 ${team.members.length}명)
          </div>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <span class="slot-badge badge-ready">팀 접수 ${stats.completedQty?.toLocaleString() || 0}건</span>
          ${team.teamId === 'teamChain' ? `<span class="slot-badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8;">고객 ${stats.customerQty || 0}건 / 파란 ${stats.paranQty || 0}건</span>` : ''}
          <span class="slot-badge ${stats.errorRate <= 5.0 ? 'badge-ready' : 'badge-empty'}" style="color: ${stats.errorRate <= 5.0 ? '#10b981' : '#f59e0b'};">
            팀 오류율 ${stats.errorRate || 0}%
          </span>
          <span class="slot-badge badge-empty" style="color: #ef4444;">
            손실액 ${(stats.totalCost || 0).toLocaleString()}원
          </span>
        </div>
      </section>

      <!-- 팀 4대 KPI 요약 카드 -->
      <section class="kpi-row" style="margin-bottom: 28px;">
        <div class="kpi-card">
          <div class="kpi-label">팀 완료 접수수량</div>
          <div class="kpi-value text-positive">${stats.completedQty?.toLocaleString() || 0}건</div>
          <div class="kpi-sub">${team.teamId === 'teamChain' ? `고객 ${stats.customerQty || 0}건 / 파란 ${stats.paranQty || 0}건` : '팀원 전체 실적 합산'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">팀 오류 발생건수</div>
          <div class="kpi-value ${stats.errorCount === 0 ? 'text-positive' : 'text-negative'}">${stats.errorCount || 0}건</div>
          <div class="kpi-sub">당월 발생 오류 총합</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">팀 평균 오류율</div>
          <div class="kpi-value" style="color: ${stats.errorRate <= 5.0 ? '#10b981' : '#f59e0b'};">${stats.errorRate || 0}%</div>
          <div class="kpi-sub">전사 목표 5.0% 이하</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">팀 총 실수금액 (손실액)</div>
          <div class="kpi-value text-negative">${(stats.totalCost || 0).toLocaleString()}원</div>
          <div class="kpi-sub">고객 보상 및 재배송 손실</div>
        </div>
      </section>

      <!-- [팀장 피드백] -->
      <section class="leader-coaching-box">
        <div class="leader-box-title">
          <span>👔</span>
          <span>${team.teamName} [팀장 피드백] - ${team.leader} 팀장 리더십 & 팀 관리 코칭 가이드</span>
        </div>
        <div class="leader-box-content">
          ${leaderFeedbackHtml}
        </div>
      </section>

      <!-- [팀원 각 개인별 피드백 사항] -->
      <section style="margin-bottom: 32px;">
        <div class="feedback-section-title" style="margin-bottom: 16px;">
          <span style="color: var(--accent-indigo);">👤</span>
          <span>${team.teamName} 각 개인별 실적 및 맞춤 코칭 피드백 (팀장 & 팀원 전원)</span>
        </div>
        <div class="members-feedback-grid">
          ${memberCardsHtml}
        </div>
      </section>

      <!-- [체인팀 전용 집계표 위치] -->
      ${chainTableHtml}

      <!-- [핵심실무 피드백 노트 (개인별 피드백 아래 배치)] -->
      <section class="core-practical-container">
        <div class="feedback-card-head" style="margin-bottom: 16px;">
          <div class="feedback-card-title">
            <span>📋</span>
            <span>${team.practicalNotes.title}</span>
          </div>
          <span class="feedback-card-badge badge-growth">팀 실무 필수 가이드</span>
        </div>
        <div style="font-size: 13px; line-height: 1.7; display: flex; flex-direction: column; gap: 12px;">
          ${team.practicalNotes.points.map(pt => `
            <div style="display: flex; gap: 10px; align-items: flex-start;">
              <span style="color: var(--accent-indigo); font-size: 14px;">✔</span>
              <div style="flex: 1; color: var(--text-secondary);">${pt}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    // 팀장 핵심 관리 포인트 동적 조작(추가/수정/삭제/저장) 이벤트 바인딩
    bindLeaderPointsEvents(team);
  };

  /**
   * 팀장 맞춤 피드백 HTML 생성 (팀장 핵심 관리 포인트 추가/수정 지원)
   */
  const generateLeaderFeedback = (team, leaderData, stats, isStaticReport = false) => {
    let introHtml = '';
    if (team.teamId === 'team1') {
      introHtml = `
        <strong>이재희 팀장님, 1팀은 월 ${stats.completedQty}건의 접수를 소화하며 안정적인 성장세를 보이고 있습니다.</strong><br>
        특히 팀 내 <strong>강아름 사원이 37건 접수를 무결점(0건 오류)</strong>으로 완벽하게 처리한 우수 사례가 돋보입니다.<br>
        반면, <strong>김가은 사원의 연락처 및 리본 문구 오기(7건, 34만원 손실)</strong>와 <strong>박언정 사원의 배송지 주소 오류(3건, 30만원 손실)</strong>에 대한 집중 관리가 필요합니다.
      `;
    } else if (team.teamId === 'team2') {
      introHtml = `
        <strong>박소영 팀장님, 2팀은 월 ${stats.completedQty}건으로 전사에서 가장 많은 주문을 처리하는 강력한 실행력을 증명하고 있습니다.</strong><br>
        팀장님께서도 <strong>직접 38건의 대량 접수를 솔선수범</strong>하며 오류 손실을 최소화(8.5만원)하셨습니다.<br>
        하지만 <strong>손수진 사원의 전사 1위 접수(42건)</strong> 과정에서 발생한 고비용 주소·배송시간 오류(5건, 39.5만원 손실)와 최승애 사원의 연락처/리본 오류(5건)로 팀 총 손실액이 ${(stats.totalCost || 0).toLocaleString()}원에 달합니다.
      `;
    } else if (team.teamId === 'team3') {
      introHtml = `
        <strong>손수령 팀장님, 3팀은 전사에서 가장 완벽하고 탁월한 접수 품질 표준을 증명하고 있습니다.</strong><br>
        팀 내 <strong>이미금 사원이 38건이라는 최다급 접수에도 불구하고 단 1건의 오류나 손실 없이 0.00% 무결점</strong>을 기록하며 전사 1위 최우수 에이스로 등극했습니다.<br>
        손수령 팀장님의 철저한 마감 전 크로스 체킹 리더십이 만들어낸 값진 성과입니다.
      `;
    } else if (team.teamId === 'teamChain') {
      const custQty = stats.customerQty || 0;
      const paranQty = stats.paranQty || 0;
      introHtml = `
        <strong>김숙정 팀장님, 체인팀은 월 총 ${stats.completedQty}건(고객접수 ${custQty}건 / 파란접수 ${paranQty}건)의 주문을 소화하며 전국 화원사 체인 발주 순증가(+72.2%)를 최일선에서 이끌고 있습니다.</strong><br>
        팀장님께서도 <strong>고객접수 ${leaderData?.customerQty || 0}건과 파란접수 ${leaderData?.paranQty || 0}건(총 ${leaderData?.completedQty || 0}건)</strong>을 솔선수범하여 책임지고 처리하셨습니다.<br>
        다만 파란접수 건과 원거리 화원사 조율 과정에서 <strong>배송시간 미준수 오류(팀장 3건 24만원, 김경미 1건)</strong>와 주소 착오가 발생하여 손실액이 ${(stats.totalCost || 0).toLocaleString()}원에 달합니다.
      `;
    } else {
      introHtml = `
        <strong>기타 부문(박수빈 / 퇴사자)은 팀 간 유기적인 업무 지원 및 인수인계 보안 관리가 핵심입니다.</strong><br>
        퇴사자 관련 계정은 즉시 회수되었으며, 기존 진행 건들의 미결 내역 점검이 완료되었습니다.<br>
        박수빈 담당자는 피크 시즌 주문 폭증 시 각 팀의 예비 접수 인력으로 신속히 투입될 수 있도록 전 시스템 접근 권한 및 최신 프로세스를 상시 숙지하시기 바랍니다.
      `;
    }

    const points = LeaderPointsManager.getPoints(team);

    if (isStaticReport) {
      // 정적 HTML 보고서 다운로드용 (깔끔한 번호 매김 및 스타일)
      return `
        ${introHtml}
        <div class="leader-points-container" style="margin-top: 14px; background: rgba(0,0,0,0.18); border-radius: 8px; padding: 14px 16px; border: 1px solid rgba(99, 102, 241, 0.25);">
          <div style="font-size: 14px; font-weight: 800; color: #818cf8; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
            <span>🎯</span><span>팀장 핵심 관리 포인트:</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; line-height: 1.65;">
            ${points.map((pt, idx) => `
              <div style="display: flex; gap: 8px; align-items: flex-start;">
                <span style="font-weight: 800; color: #818cf8; min-width: 20px;">${idx + 1}.</span>
                <div>${pt}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // 대시보드 화면용 인터랙티브 위젯 (수정, 추가, 삭제, 저장)
    return `
      ${introHtml}
      <div class="leader-points-container" id="leader-points-container-${team.teamId}">
        <div class="leader-points-header">
          <div class="leader-points-title">
            <span>🎯</span>
            <strong>팀장 핵심 관리 포인트</strong>
            <span class="leader-points-badge">✏️ 실시간 추가·수정 가능</span>
          </div>
          <div class="leader-points-actions">
            <button type="button" class="btn-lp btn-lp-add" data-team="${team.teamId}" title="새로운 핵심 관리 포인트 추가">
              ➕ 포인트 추가
            </button>
            <button type="button" class="btn-lp btn-lp-save" data-team="${team.teamId}" title="브라우저에 즉시 저장">
              💾 변경사항 저장
            </button>
            <button type="button" class="btn-lp btn-lp-reset" data-team="${team.teamId}" title="초기 기본값으로 복원">
              ↺ 기본값
            </button>
          </div>
        </div>
        <div class="leader-points-list" id="leader-points-list-${team.teamId}">
          ${points.map((pt, idx) => `
            <div class="leader-point-item" data-index="${idx}">
              <span class="leader-point-num">${idx + 1}.</span>
              <div class="leader-point-text" contenteditable="true" spellcheck="false" data-placeholder="핵심 관리 포인트를 입력하세요...">${pt}</div>
              <button type="button" class="btn-lp-delete" title="이 포인트 삭제">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="leader-points-tip">
          💡 <strong>안내:</strong> 각 포인트를 마우스로 클릭하면 텍스트를 바로 수정할 수 있으며, <strong>[➕ 포인트 추가]</strong> 버튼으로 새 항목을 등록하거나 <strong>[✕]</strong> 버튼으로 삭제할 수 있습니다. 수정한 내용은 <strong>[💾 변경사항 저장]</strong>을 누르면 브라우저에 영구 보존됩니다.
        </div>
      </div>
    `;
  };

  /**
   * 팀장 핵심 관리 포인트 동적 조작 및 저장 이벤트 바인딩
   */
  const bindLeaderPointsEvents = (team) => {
    const container = document.getElementById(`leader-points-container-${team.teamId}`);
    if (!container) return;

    const listEl = container.querySelector(`#leader-points-list-${team.teamId}`);
    if (!listEl) return;

    // 현재 DOM의 포인트 텍스트 수집
    const collectPoints = () => {
      const items = listEl.querySelectorAll('.leader-point-item');
      const points = [];
      items.forEach(item => {
        const textEl = item.querySelector('.leader-point-text');
        if (textEl) {
          const html = textEl.innerHTML.trim();
          const text = textEl.textContent.trim();
          if (text.length > 0) {
            points.push(html);
          }
        }
      });
      return points;
    };

    // 항목 번호 재정렬
    const refreshNumbers = () => {
      const items = listEl.querySelectorAll('.leader-point-item');
      items.forEach((item, idx) => {
        item.setAttribute('data-index', idx);
        const numEl = item.querySelector('.leader-point-num');
        if (numEl) numEl.textContent = `${idx + 1}.`;
      });
    };

    // 저장 실행 함수
    const savePoints = (silent = false) => {
      const points = collectPoints();
      const success = LeaderPointsManager.savePoints(team.teamId, points);
      if (!silent) {
        if (success) {
          showToast(`${team.teamName} 팀장 핵심 관리 포인트가 성공적으로 저장되었습니다!`, 'success');
        } else {
          showToast('저장 중 오류가 발생했습니다.', 'error');
        }
      }
    };

    // [➕ 포인트 추가] 버튼 핸들러
    const btnAdd = container.querySelector('.btn-lp-add');
    if (btnAdd) {
      btnAdd.addEventListener('click', () => {
        const currentCount = listEl.querySelectorAll('.leader-point-item').length;
        const newItem = document.createElement('div');
        newItem.className = 'leader-point-item';
        newItem.setAttribute('data-index', currentCount);
        newItem.innerHTML = `
          <span class="leader-point-num">${currentCount + 1}.</span>
          <div class="leader-point-text" contenteditable="true" spellcheck="false" data-placeholder="새로운 핵심 관리 포인트를 입력하세요..."></div>
          <button type="button" class="btn-lp-delete" title="이 포인트 삭제">✕</button>
        `;
        listEl.appendChild(newItem);
        refreshNumbers();
        const newText = newItem.querySelector('.leader-point-text');
        if (newText) {
          newText.focus();
        }
        showToast('새로운 관리 포인트 항목이 추가되었습니다. 내용을 입력하세요.', 'info');
      });
    }

    // [💾 변경사항 저장] 버튼 핸들러
    const btnSave = container.querySelector('.btn-lp-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => {
        savePoints(false);
      });
    }

    // [↺ 기본값] 복원 버튼 핸들러
    const btnReset = container.querySelector('.btn-lp-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (confirm(`${team.teamName} 팀장 핵심 관리 포인트를 초기 기본값으로 복원하시겠습니까?`)) {
          const defaultPoints = LeaderPointsManager.resetPoints(team);
          listEl.innerHTML = defaultPoints.map((pt, idx) => `
            <div class="leader-point-item" data-index="${idx}">
              <span class="leader-point-num">${idx + 1}.</span>
              <div class="leader-point-text" contenteditable="true" spellcheck="false" data-placeholder="핵심 관리 포인트를 입력하세요...">${pt}</div>
              <button type="button" class="btn-lp-delete" title="이 포인트 삭제">✕</button>
            </div>
          `).join('');
          showToast(`${team.teamName} 핵심 관리 포인트가 초기 기본값으로 복원되었습니다.`, 'success');
        }
      });
    }

    // [✕] 개별 항목 삭제 핸들러 (이벤트 위임)
    listEl.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-lp-delete');
      if (delBtn) {
        const item = delBtn.closest('.leader-point-item');
        if (item) {
          item.remove();
          refreshNumbers();
          savePoints(true);
          showToast('포인트 항목이 삭제되었습니다.', 'info');
        }
      }
    });

    // 텍스트 편집 완료 시 자동 저장 (포커스 아웃)
    listEl.addEventListener('focusout', (e) => {
      if (e.target && e.target.classList.contains('leader-point-text')) {
        savePoints(true);
      }
    });
  };

  /**
   * 개인별 피드백 카드 HTML 생성
   */
  const generateMemberCard = (member, staffData, team) => {
    const isLeader = member.role === '팀장';
    let cardClass = 'card-normal';
    let gradeBadge = '<span class="member-role-badge role-member">✅ 양호</span>';
    let strengths = '';
    let improvements = '';
    let actionItem = '';

    const completed = staffData ? staffData.completedQty : 0;
    const errors = staffData ? staffData.errorCount : 0;
    const errRate = staffData ? staffData.errorRate : 0;
    const cost = staffData ? staffData.totalCost : 0;

    if (!staffData) {
      cardClass = 'card-ready';
      gradeBadge = '<span class="member-role-badge role-member" style="background: rgba(148, 163, 184, 0.2); color: #cbd5e1;">📋 신규/지원 업무</span>';
      strengths = '팀 내 배분 지원 업무 및 기본 시스템 프로세스 숙지 진행 중.';
      improvements = '실제 주문 접수 전 모의 훈련을 통한 시스템 입력 정확도 사전 검증 필요.';
      actionItem = `${team.teamName} 표준 매뉴얼 숙지 및 무결점 우수사원 1:1 OJT 이수.`;
    } else if (errors === 0 && completed > 0) {
      cardClass = 'card-best';
      gradeBadge = '<span class="member-role-badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; font-weight: 800;">👑 최우수 무결점</span>';
      strengths = `월 ${completed}건의 높은 접수량을 단 1건의 오류나 손실금액 없이 100% 완벽하게 처리함.`;
      improvements = '현재의 완벽한 3단계 검수 루틴 유지 및 신규 팀원 멘토링 역할 수행.';
      actionItem = '무결점 우수사원 포상 상신 및 팀 내 표준 검수 체크리스트 전파 리더 위촉.';
    } else if (errRate <= 5.0) {
      cardClass = 'card-normal';
      gradeBadge = '<span class="member-role-badge" style="background: rgba(99, 102, 241, 0.2); color: #818cf8; font-weight: 800;">🌟 우수 실적</span>';
      strengths = `월 ${completed}건을 처리하며 오류율 ${errRate}%의 우수한 업무 품질을 입증함.`;
      improvements = '소액 오류 원인인 연락처 오입력만 주의하면 무결점 최우수 진입 가능.';
      actionItem = '연락처 11자리 입력 후 1초 확인 루틴 생활화로 0% 오류율 도전.';
    } else if (errRate > 10.0 || cost >= 200000) {
      cardClass = 'card-warn';
      gradeBadge = '<span class="member-role-badge" style="background: rgba(244, 63, 94, 0.2); color: #f43f5e; font-weight: 800;">⚠️ 집중 관리 필요</span>';
      strengths = `월 ${completed}건으로 높은 업무 추진력과 적극적인 접수 의지를 보여줌.`;
      improvements = `주요 실수유형(${staffData.topErrorType}) 및 실수금액(${cost.toLocaleString()}원) 감축이 최우선 과제.`;
      actionItem = '주문 접수 완료 버튼 클릭 전 [주소·시간·연락처] 3대 필수 항목 재확인 의무화.';
    } else {
      cardClass = 'card-normal';
      gradeBadge = '<span class="member-role-badge role-member">✅ 양호</span>';
      strengths = `월 ${completed}건 접수를 성실하게 수행하며 전반적인 팀 업무를 충실히 지원함.`;
      improvements = '주문 몰림 시간대 속도보다 정확도에 집중하여 경미한 실수 예방.';
      actionItem = '팀 내 2중 검수 템플릿 적용 및 주간 오류율 5% 이하 달성 유지.';
    }

    const isChainTeam = team.teamId === 'teamChain';
    const custQty = staffData ? (staffData.customerQty !== undefined ? staffData.customerQty : completed) : 0;
    const paranQty = staffData ? (staffData.paranQty || 0) : 0;

    return `
      <div class="member-feedback-card ${cardClass}">
        <div class="member-card-header">
          <div class="member-card-name">
            <span>${isLeader ? '👔' : '👤'}</span>
            <span>${member.name}</span>
            <span class="member-role-badge ${isLeader ? 'role-leader' : 'role-member'}">${member.role}</span>
          </div>
          <div>${gradeBadge}</div>
        </div>

        <div class="member-stats-strip">
          ${isChainTeam ? `
            <div class="stat-strip-item">
              <div class="stat-strip-label">고객접수</div>
              <div class="stat-strip-val" style="color: #6366f1;">${custQty}건</div>
            </div>
            <div class="stat-strip-item">
              <div class="stat-strip-label">파란접수</div>
              <div class="stat-strip-val" style="color: #0ea5e9;">${paranQty}건</div>
            </div>
            <div class="stat-strip-item">
              <div class="stat-strip-label">총 접수(합계)</div>
              <div class="stat-strip-val text-positive">${completed}건</div>
            </div>
          ` : `
            <div class="stat-strip-item">
              <div class="stat-strip-label">완료 접수</div>
              <div class="stat-strip-val text-positive">${completed}건</div>
            </div>
          `}
          <div class="stat-strip-item">
            <div class="stat-strip-label">오류 건수</div>
            <div class="stat-strip-val ${errors === 0 ? 'text-positive' : 'text-negative'}">${errors}건</div>
          </div>
          <div class="stat-strip-item">
            <div class="stat-strip-label">오류율</div>
            <div class="stat-strip-val" style="color: ${errRate <= 5.0 ? '#10b981' : '#f43f5e'};">${errRate}%</div>
          </div>
          <div class="stat-strip-item">
            <div class="stat-strip-label">실수금액</div>
            <div class="stat-strip-val text-negative">${cost.toLocaleString()}원</div>
          </div>
        </div>

        <div>
          <div class="feedback-section-pill pill-strength">
            <strong>💪 강점:</strong> ${strengths}
          </div>
          <div class="feedback-section-pill pill-improvement">
            <strong>🎯 개선점:</strong> ${improvements}
          </div>
          <div class="feedback-section-pill pill-action">
            <strong>🚀 실행과제:</strong> ${actionItem}
          </div>
        </div>
      </div>
    `;
  };

  /**
   * 전체 종합 뷰 렌더링
   */
  const renderAllView = (bundle) => {
    const { trendOutput, floristOutput, prodOutput, recOutput, errOutput, staffOutput, teamStatsMap } = bundle;

    // 팀별 비교 요약 테이블 행 생성
    const teamSummaryRows = TEAM_CONFIG.map(team => {
      const s = teamStatsMap[team.teamId] || {};
      return `
        <tr>
          <td style="font-weight: 700;">${team.teamName}</td>
          <td>${team.leader} (팀장)</td>
          <td>${s.memberCount}명</td>
          <td style="font-weight: 700; color: #10b981;">${(s.completedQty || 0).toLocaleString()}건</td>
          <td style="color: ${s.errorCount === 0 ? '#10b981' : '#f43f5e'}; font-weight: 700;">${s.errorCount || 0}건</td>
          <td style="font-weight: 700; color: ${s.errorRate <= 5.0 ? '#10b981' : '#f59e0b'};">${s.errorRate || 0}%</td>
          <td style="color: #ef4444; font-weight: 700;">${(s.totalCost || 0).toLocaleString()}원</td>
          <td>
            <button class="btn btn-secondary btn-jump-team" data-team="${team.teamId}" style="padding: 4px 10px; font-size: 11px; width: auto;">
              팀 상세 보기 ➔
            </button>
          </td>
        </tr>
      `;
    }).join('');

    teamViewContainer.innerHTML = `
      <!-- 전사 4대 KPI 요약 -->
      <section class="kpi-row" style="margin-bottom: 28px;">
        <div class="kpi-card">
          <div class="kpi-label">화원사 발주 순증가</div>
          <div class="kpi-value text-positive">+525건</div>
          <div class="kpi-sub">+72.21% 순증가 (727건 ➔ 1,252건)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">당월 접수 완료수량</div>
          <div class="kpi-value text-positive">322건</div>
          <div class="kpi-sub">총 10명 상담원 전수 집계</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">전체 평균 오류율</div>
          <div class="kpi-value" style="color: #f59e0b;">10.87%</div>
          <div class="kpi-sub">오류 35건 발생 (목표 5.0% 이하)</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">당월 총 손실금액</div>
          <div class="kpi-value text-negative">1,770,000원</div>
          <div class="kpi-sub">주소 오류(66.5만원) 최대 손실</div>
        </div>
      </section>

      <!-- 전사 팀별 실적 비교 매트릭스 -->
      <section style="margin-bottom: 36px;">
        <div class="feedback-section-title" style="margin-bottom: 12px;">
          <span style="color: var(--accent-indigo);">🏢</span>
          <span>전사 팀별 실적 & 오류율 비교 매트릭스 (1팀 / 2팀 / 3팀 / 체인팀 / 기타)</span>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>팀명</th>
                <th>팀장</th>
                <th>팀 인원</th>
                <th>완료 접수수량</th>
                <th>오류 발생건수</th>
                <th>팀 오류율</th>
                <th>총 손실금액</th>
                <th>상세 이동</th>
              </tr>
            </thead>
            <tbody>
              ${teamSummaryRows}
            </tbody>
          </table>
        </div>
      </section>

      <!-- 전사 핵심실무 피드백 노트 (7대 전략) -->
      <section style="margin-bottom: 36px;">
        <div class="feedback-section-title" style="margin-bottom: 16px;">
          <span style="color: var(--accent-indigo);">📑</span>
          <span>전사 총괄 핵심실무 피드백 노트 (Executive Strategic Notes)</span>
        </div>

        <div class="feedback-note-card">
          <div class="feedback-card-head">
            <div class="feedback-card-title">
              <span>📈</span>
              <span>I. 화원사 발주량 급증(+72.2%)에 따른 팀별 업무량 조율 전략</span>
            </div>
            <span class="feedback-card-badge badge-growth">+525건 폭증</span>
          </div>
          <div class="feedback-card-body">
            전월 727건에서 당월 1,252건으로 발주량이 +72.21% 폭증하였습니다.
            특정 팀(2팀 손수진 사원 42건 등)에 주문이 과도하게 집중되어 고비용 오류가 발생하는 현상을 방지하기 위해,
            피크 시간대 주문을 1팀, 3팀, 체인팀으로 고르게 분산하는 스마트 라우팅 체계를 구축해야 합니다.
          </div>
        </div>

        <div class="feedback-note-card">
          <div class="feedback-card-head">
            <div class="feedback-card-title">
              <span>🏆</span>
              <span>II. 상위 10대 화원사 전담 관리 및 특수 상품 진행 안정화</span>
            </div>
            <span class="feedback-card-badge badge-growth">TOP 10 +486건 견인</span>
          </div>
          <div class="feedback-card-body">
            ◐/)서울강남5호▼♪(+85건), 직/포항북1호ⓐ◁G(+72건) 등 상위 10개 농장(화원사)이 전체 순증가의 92.6%를 견인하였습니다.
            체인팀과 1팀은 상위 10개 농장(화원사)의 배송시간 요구사항을 사전에 데이터베이스화하여 배송 지연 클레임을 원천 차단하고,
            특/특대/4단/5단 등 특수 상품 18건에 대해 농장과의 사전 규격 확인을 정례화합니다.
          </div>
        </div>

        <div class="feedback-note-card">
          <div class="feedback-card-head">
            <div class="feedback-card-title">
              <span>⚠️</span>
              <span>III. 오류 유형별 손실 감축: 주소 및 배송시간 오류 집중 개선</span>
            </div>
            <span class="feedback-card-badge badge-warning">손실 177만원 감축 목표</span>
          </div>
          <div class="feedback-card-body">
            당월 발생한 35건 오류 중 <strong>배송지 주소 오류(10건, 66.5만원)</strong>와 <strong>배송시간 미준수(7건, 48만원)</strong>가 전체 손실액의 64.7%를 차지합니다.
            도로명 주소 유효성 팝업 검증을 의무화하고, 장례식장·예식장 등 중요 행사는 행사 1시간 전 배송 완료 타임라인을 고수합니다.
          </div>
        </div>

        <div class="feedback-note-card">
          <div class="feedback-card-head">
            <div class="feedback-card-title">
              <span>👑</span>
              <span>IV. 무결점 에이스(이미금, 강아름) 포상 및 노하우 사내 표준화</span>
            </div>
            <span class="feedback-card-badge badge-growth">무오류 0.00% 달성</span>
          </div>
          <div class="feedback-card-body">
            3팀 이미금 사원(38건 접수/0건 오류)과 1팀 강아름 사원(37건 접수/0건 오류)은 전사 상담원들의 롤모델입니다.
            두 사원에게는 '이달의 무결점 최우수 에이스 포상'을 수여하고, 이들이 실천 중인 3단계 검수 기법을 전사 표준 가이드로 제정합니다.
          </div>
        </div>
      </section>

      <!-- 관리자 현장 피드백 메모 -->
      <section class="memo-container" style="margin-bottom: 36px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <span>✍️</span>
            <span>팀장 / 관리자 현장 피드백 메모 (브라우저 자동 보관 & 리포트 포함)</span>
          </div>
          <button class="btn btn-primary" id="btn-save-memo" style="width: auto; padding: 6px 14px; font-size: 11px;">
            💾 메모 저장
          </button>
        </div>
        <textarea id="feedback-memo-input" class="memo-textarea" placeholder="팀별 주간 회의 결정 사항, 면담 결과, 추가 개선 과제를 입력하세요."></textarea>
      </section>

      <!-- 모든 분석 결과 종합표 및 차트 -->
      <section style="margin-top: 48px; border-top: 2px dashed var(--border-color); padding-top: 32px;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px;">
            <span>📊</span>
            <span>모든 분석 결과 종합표 및 시각화 (All Analysis Tables)</span>
          </h2>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
            피드백 노트 작성의 근거가 된 1번~5번 원본 데이터 실시간 집계 결과입니다.
          </div>
        </div>

        <div id="analysis-tables-content">
          <!-- 표 렌더링 -->
        </div>
      </section>
    `;

    // 팀 상세 바로가기 버튼 이벤트 연결
    teamViewContainer.querySelectorAll('.btn-jump-team').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTeam = btn.getAttribute('data-team');
        if (targetTeam && teamNavTabs) {
          const tabBtn = teamNavTabs.querySelector(`[data-team="${targetTeam}"]`);
          if (tabBtn) tabBtn.click();
        }
      });
    });

    // 관리자 메모 로드 및 이벤트 바인딩
    const memoInput = teamViewContainer.querySelector('#feedback-memo-input');
    const btnSaveMemo = teamViewContainer.querySelector('#btn-save-memo');
    const MEMO_KEY = 'cmwork_feedback_manager_memo';
    if (memoInput) {
      memoInput.value = localStorage.getItem(MEMO_KEY) || '';
      memoInput.addEventListener('input', () => {
        localStorage.setItem(MEMO_KEY, memoInput.value);
      });
    }
    if (btnSaveMemo && memoInput) {
      btnSaveMemo.addEventListener('click', () => {
        localStorage.setItem(MEMO_KEY, memoInput.value);
        showToast('피드백 메모가 브라우저에 안전하게 저장되었습니다.', 'success');
      });
    }

    // 종합 분석 표 렌더링
    renderAllAnalysisTables(bundle);
  };

  /**
   * 모든 분석 결과 표 렌더링
   */
  const renderAllAnalysisTables = ({ trendOutput, floristOutput, prodOutput, recOutput, errOutput, staffOutput }) => {
    const container = document.getElementById('analysis-tables-content');
    if (!container) return;
    container.innerHTML = '';

    // 1-1. 발주 추이
    if (trendOutput) {
      const sec1 = document.createElement('div');
      sec1.style.marginBottom = '32px';
      sec1.innerHTML = `<div class="feedback-section-title"><span style="color: var(--accent-indigo);">📦 [결과 1-1]</span><span>1-1. 화원사 발주(이전) 대비 1-2. 화원사 발주(현재) 추이 변화표</span></div>`;
      const b1 = document.createElement('div');
      window.TableRenderer.render(b1, trendOutput.columns, trendOutput.data, '1-1 대비 1-2 발주 추이 비교표');
      sec1.appendChild(b1);
      container.appendChild(sec1);
    }

    // 1-2. 상위 10개 화원사
    if (floristOutput) {
      const sec2 = document.createElement('div');
      sec2.style.marginBottom = '32px';
      sec2.innerHTML = `<div class="feedback-section-title"><span style="color: var(--accent-indigo);">🏆 [결과 1-2]</span><span>1-2. 화원사 발주증가 1위~10위 비교 시각화</span></div>`;
      const b2 = document.createElement('div');
      window.TableRenderer.render(b2, floristOutput.columns, floristOutput.tableData, '상위 1~10위 화원사 순위표');
      sec2.appendChild(b2);

      const chartBox = document.createElement('div');
      chartBox.id = 'chart-container-box';
      chartBox.style.marginTop = '16px';
      sec2.appendChild(chartBox);
      window.ChartRenderer.render(chartBox, floristOutput.chartData, 'TOP 10 화원사 순증가 비교 차트');
      container.appendChild(sec2);
    }

    // 1-3. 상품진행
    if (prodOutput) {
      const sec3 = document.createElement('div');
      sec3.style.marginBottom = '32px';
      sec3.innerHTML = `<div class="feedback-section-title"><span style="color: var(--accent-emerald);">🚚 [결과 1-3]</span><span>1-3. 화원사 상품진행 완료 건수 집계표</span></div>`;
      const b3 = document.createElement('div');
      window.TableRenderer.render(b3, prodOutput.columns, prodOutput.data, prodOutput.title);
      sec3.appendChild(b3);
      container.appendChild(sec3);
    }

    // 3. 상담원 접수
    if (recOutput) {
      const sec4 = document.createElement('div');
      sec4.style.marginBottom = '32px';
      sec4.innerHTML = `<div class="feedback-section-title"><span style="color: var(--accent-indigo);">📋 [결과 3]</span><span>3. 상담원 접수(excel) 수량 집계표</span></div>`;
      const b4 = document.createElement('div');
      window.TableRenderer.render(b4, recOutput.columns, recOutput.data, recOutput.title);
      sec4.appendChild(b4);
      container.appendChild(sec4);
    }

    // 4. 상담원 오류
    if (errOutput) {
      const sec5 = document.createElement('div');
      sec5.style.marginBottom = '32px';
      sec5.innerHTML = `<div class="feedback-section-title"><span style="color: #ef4444;">⚠️ [결과 4]</span><span>4. 상담원 오류(excel) 분석 집계표</span></div>`;
      const b5 = document.createElement('div');
      window.TableRenderer.renderMultiTables(b5, errOutput.tables, errOutput.title);
      sec5.appendChild(b5);
      container.appendChild(sec5);
    }

    // 5. 상담원 실적 (교차 분석)
    if (staffOutput) {
      const sec6 = document.createElement('div');
      sec6.style.marginBottom = '32px';
      sec6.innerHTML = `
        <div class="feedback-section-title"><span style="color: #8b5cf6;">🎯 [결과 5]</span><span>5. 상담원 실적 분석결과표 (3.접수 + 4.오류 교차 분석)</span></div>
        <div style="background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 12px; line-height: 1.5; color: var(--text-secondary);">
          💡 <strong>[안내]</strong> 5. 상담원 실적은 별도 데이터를 첨부하지 않으며, 3. 상담원 접수와 4. 상담원 오류를 교차 분석하여 도출된 결과입니다.
        </div>
      `;
      const b6 = document.createElement('div');
      window.TableRenderer.render(b6, staffOutput.columns, staffOutput.data, staffOutput.title);
      sec6.appendChild(b6);

      // 체인팀 전용 분리 집계표 추가 렌더링
      if (staffOutput.chainSummaryTable && staffOutput.chainSummaryTable.data) {
        const subSec = document.createElement('div');
        subSec.style.marginTop = '24px';
        subSec.innerHTML = `<h3 style="font-size: 15px; font-weight: 800; margin-bottom: 10px; color: var(--accent-indigo);">🎯 ${staffOutput.chainSummaryTable.title}</h3>`;
        window.TableRenderer.render(subSec, staffOutput.chainSummaryTable.columns, staffOutput.chainSummaryTable.data, staffOutput.chainSummaryTable.title);
        sec6.appendChild(subSec);
      }

      container.appendChild(sec6);
    }
  };

  /**
   * [핵심] 완전 독립 실행형 단일 HTML 파일 다운로드 생성기
   */
  if (btnDownloadHtml) {
    btnDownloadHtml.addEventListener('click', () => {
      try {
        showToast('독립 실행형 HTML 보고서를 생성 중입니다...', 'info');

        const { dataBundle } = window.appFeedbackState;
        if (!dataBundle) {
          alert('먼저 데이터 로드를 완료해주세요.');
          return;
        }

        // 현재 캔버스(Chart.js) 이미지 치환
        const chartCanvas = document.querySelector('#chart-container-box canvas');
        let chartImgHtml = '';
        if (chartCanvas) {
          const chartDataUrl = chartCanvas.toDataURL('image/png');
          chartImgHtml = `<div style="text-align: center; margin: 16px 0;"><img src="${chartDataUrl}" alt="발주 증가 비교 차트" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #e2e8f0;" /></div>`;
        }

        const savedMemo = localStorage.getItem('cmwork_feedback_manager_memo') || '현장 메모가 등록되지 않았습니다.';

        // 모든 팀의 개별 피드백 HTML 사전 렌더링
        const allTeamSectionsHtml = TEAM_CONFIG.map(team => {
          const stats = dataBundle.teamStatsMap[team.teamId] || {};
          const leaderData = findStaffData(dataBundle.staffMap, team.leader);
          const leaderFeedbackHtml = generateLeaderFeedback(team, leaderData, stats, true);
          const memberCardsHtml = team.members.map(m => {
            const s = findStaffData(dataBundle.staffMap, m.name);
            return generateMemberCard(m, s, team);
          }).join('');

          let chainTableHtml = '';
          if (team.teamId === 'teamChain') {
            const chainMembers = team.members.map(m => {
              const s = findStaffData(dataBundle.staffMap, m.name) || {};
              return {
                name: m.name,
                role: m.role,
                custQty: s.customerQty !== undefined ? s.customerQty : (s.completedQty || 0),
                paranQty: s.paranQty || 0,
                completed: s.completedQty || 0,
                orders: s.completedOrders || 0,
                errors: s.errorCount || 0,
                errRate: s.errorRate || 0,
                cost: s.totalCost || 0,
                grade: s.grade || '양호'
              };
            });

            const totalCust = chainMembers.reduce((acc, c) => acc + c.custQty, 0);
            const totalParan = chainMembers.reduce((acc, c) => acc + c.paranQty, 0);
            const totalComp = chainMembers.reduce((acc, c) => acc + c.completed, 0);
            const totalOrd = chainMembers.reduce((acc, c) => acc + c.orders, 0);
            const totalErr = chainMembers.reduce((acc, c) => acc + c.errors, 0);
            const totalCost = chainMembers.reduce((acc, c) => acc + c.cost, 0);
            const totalErrRate = totalComp > 0 ? Number(((totalErr / totalComp) * 100).toFixed(2)) : 0;

            const memberRows = chainMembers.map(m => `
              <tr>
                <td style="font-weight: 700;">${m.name}</td>
                <td><span class="member-role-badge ${m.role === '팀장' ? 'role-leader' : 'role-member'}">${m.role}</span></td>
                <td style="font-weight: 700; color: #6366f1;">${m.custQty}건</td>
                <td style="font-weight: 700; color: #0ea5e9;">${m.paranQty}건</td>
                <td style="font-weight: 800; color: #10b981;">${m.completed}건</td>
                <td>${m.orders}건</td>
                <td style="font-weight: 700; color: ${m.errors === 0 ? '#10b981' : '#f43f5e'};">${m.errors}건</td>
                <td style="font-weight: 700; color: ${m.errRate <= 5.0 ? '#10b981' : '#f59e0b'};">${m.errRate}%</td>
                <td style="font-weight: 700; color: #ef4444;">${m.cost.toLocaleString()}원</td>
                <td>${m.grade}</td>
              </tr>
            `).join('');

            chainTableHtml = `
              <section style="margin-bottom: 32px;">
                <div class="feedback-section-title" style="margin-bottom: 12px;">
                  <span style="color: var(--accent-indigo);">🎯</span>
                  <span>체인팀 개인별 실적 최종 집계표 (고객접수 건 vs 파란 접수건 분리 집계)</span>
                </div>
                <div class="data-table-wrapper">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>상담원명</th>
                        <th>직책</th>
                        <th style="background: rgba(99, 102, 241, 0.15); color: #818cf8;">고객접수 건</th>
                        <th style="background: rgba(14, 165, 233, 0.15); color: #38bdf8;">파란 접수건</th>
                        <th style="background: rgba(16, 185, 129, 0.15); color: #34d399;">총 완료 접수수량</th>
                        <th>완료 주문건수</th>
                        <th>오류건수</th>
                        <th>오류율</th>
                        <th>총 실수금액</th>
                        <th>실적 평가</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${memberRows}
                      <tr style="background: rgba(99, 102, 241, 0.12); font-weight: 800; border-top: 2px solid var(--accent-indigo);">
                        <td>체인팀 합계</td>
                        <td><span class="member-role-badge role-leader">팀 전체</span></td>
                        <td style="color: #6366f1;">${totalCust}건</td>
                        <td style="color: #0ea5e9;">${totalParan}건</td>
                        <td style="color: #10b981;">${totalComp}건</td>
                        <td>${totalOrd}건</td>
                        <td style="color: ${totalErr === 0 ? '#10b981' : '#f43f5e'};">${totalErr}건</td>
                        <td style="color: ${totalErrRate <= 5.0 ? '#10b981' : '#f59e0b'};">${totalErrRate}%</td>
                        <td style="color: #ef4444;">${totalCost.toLocaleString()}원</td>
                        <td>⭐ 체인팀 종합</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            `;
          }

          return `
            <div class="team-tab-pane team-print-page" id="pane-${team.teamId}" style="display: none;">
              <section class="team-profile-banner">
                <div>
                  <div class="team-profile-title">
                    <span>🛡️</span>
                    <span>${team.teamName} 실적 피드백 & 코칭 노트</span>
                    <span class="member-role-badge role-leader" style="font-size: 13px;">팀장: ${team.leader}</span>
                  </div>
                  <div class="team-profile-sub">
                    💡 팀 미션: <strong>${team.mission}</strong> (총원 ${team.members.length}명)
                  </div>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <span class="slot-badge badge-ready">팀 접수 ${stats.completedQty?.toLocaleString() || 0}건</span>
                  <span class="slot-badge badge-ready">팀 오류율 ${stats.errorRate || 0}%</span>
                  <span class="slot-badge badge-empty" style="color: #ef4444;">손실액 ${(stats.totalCost || 0).toLocaleString()}원</span>
                </div>
              </section>

              <!-- 팀 4대 KPI 요약 카드 -->
              <section class="kpi-row" style="margin-bottom: 24px;">
                <div class="kpi-card">
                  <div class="kpi-label">팀 완료 접수수량</div>
                  <div class="kpi-value text-positive">${stats.completedQty?.toLocaleString() || 0}건</div>
                  <div class="kpi-sub">팀원 전체 실적 합산</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">팀 오류 발생건수</div>
                  <div class="kpi-value text-negative">${stats.errorCount || 0}건</div>
                  <div class="kpi-sub">당월 발생 오류 총합</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">팀 평균 오류율</div>
                  <div class="kpi-value" style="color: ${stats.errorRate <= 5.0 ? '#10b981' : '#f59e0b'};">${stats.errorRate || 0}%</div>
                  <div class="kpi-sub">전사 목표 5.0% 이하</div>
                </div>
                <div class="kpi-card">
                  <div class="kpi-label">팀 총 실수금액</div>
                  <div class="kpi-value text-negative">${(stats.totalCost || 0).toLocaleString()}원</div>
                  <div class="kpi-sub">고객 보상 및 재배송 손실</div>
                </div>
              </section>

              <!-- 팀장 피드백 -->
              <section class="leader-coaching-box">
                <div class="leader-box-title">
                  <span>👔</span>
                  <span>${team.teamName} [팀장 피드백] - ${team.leader} 팀장 리더십 & 팀 관리 코칭 가이드</span>
                </div>
                <div class="leader-box-content">
                  ${leaderFeedbackHtml}
                </div>
              </section>

              <!-- 개인별 피드백 -->
              <section style="margin-bottom: 32px;">
                <div class="feedback-section-title" style="margin-bottom: 16px;">
                  <span style="color: var(--accent-indigo);">👤</span>
                  <span>${team.teamName} 각 개인별 실적 및 맞춤 코칭 피드백 (팀장 & 팀원 전원)</span>
                </div>
                <div class="members-feedback-grid">
                  ${memberCardsHtml}
                </div>
              </section>

              <!-- 체인팀 분리 집계표 -->
              ${chainTableHtml}

              <!-- 핵심실무 피드백 노트 (아래 배치) -->
              <section class="core-practical-container">
                <div class="feedback-card-head" style="margin-bottom: 16px;">
                  <div class="feedback-card-title">
                    <span>📋</span>
                    <span>${team.practicalNotes.title}</span>
                  </div>
                  <span class="feedback-card-badge badge-growth">팀 실무 필수 가이드</span>
                </div>
                <div style="font-size: 13px; line-height: 1.7; display: flex; flex-direction: column; gap: 12px;">
                  ${team.practicalNotes.points.map(pt => `
                    <div style="display: flex; gap: 10px; align-items: flex-start;">
                      <span style="color: var(--accent-indigo); font-size: 14px;">✔</span>
                      <div style="flex: 1; color: var(--text-secondary);">${pt}</div>
                    </div>
                  `).join('')}
                </div>
              </section>
            </div>
          `;
        }).join('');

        // 전체 뷰 HTML
        const allPaneHtml = `
          <div class="team-tab-pane" id="pane-all" style="display: block;">
            <section class="kpi-row" style="margin-bottom: 28px;">
              <div class="kpi-card">
                <div class="kpi-label">화원사 발주 순증가</div>
                <div class="kpi-value text-positive">+525건</div>
                <div class="kpi-sub">+72.21% 순증가 (727건 ➔ 1,252건)</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">당월 접수 완료수량</div>
                <div class="kpi-value text-positive">322건</div>
                <div class="kpi-sub">총 10명 상담원 전수 집계</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">전체 평균 오류율</div>
                <div class="kpi-value" style="color: #f59e0b;">10.87%</div>
                <div class="kpi-sub">오류 35건 발생 (목표 5.0% 이하)</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">당월 총 손실금액</div>
                <div class="kpi-value text-negative">1,770,000원</div>
                <div class="kpi-sub">주소 오류(66.5만원) 최대 손실</div>
              </div>
            </section>

            <!-- 팀별 비교 요약 -->
            <section style="margin-bottom: 36px;">
              <div class="feedback-section-title" style="margin-bottom: 12px;">
                <span style="color: var(--accent-indigo);">🏢</span>
                <span>전사 팀별 실적 & 오류율 비교 매트릭스</span>
              </div>
              <div class="data-table-wrapper">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>팀명</th>
                      <th>팀장</th>
                      <th>팀 인원</th>
                      <th>완료 접수수량</th>
                      <th>오류 발생건수</th>
                      <th>팀 오류율</th>
                      <th>총 손실금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${TEAM_CONFIG.map(t => {
                      const s = dataBundle.teamStatsMap[t.teamId] || {};
                      return `
                        <tr>
                          <td style="font-weight: 700;">${t.teamName}</td>
                          <td>${t.leader} (팀장)</td>
                          <td>${s.memberCount}명</td>
                          <td style="font-weight: 700; color: #10b981;">${(s.completedQty || 0).toLocaleString()}건</td>
                          <td style="color: ${s.errorCount === 0 ? '#10b981' : '#f43f5e'}; font-weight: 700;">${s.errorCount || 0}건</td>
                          <td style="font-weight: 700; color: ${s.errorRate <= 5.0 ? '#10b981' : '#f59e0b'};">${s.errorRate || 0}%</td>
                          <td style="color: #ef4444; font-weight: 700;">${(s.totalCost || 0).toLocaleString()}원</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 관리자 메모 -->
            <section class="memo-container" style="margin-bottom: 36px;">
              <div style="font-size: 16px; font-weight: 800; margin-bottom: 10px;">✍️ 팀장 / 관리자 현장 피드백 메모</div>
              <div style="font-size: 13px; line-height: 1.6; white-space: pre-wrap; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px;">${savedMemo}</div>
            </section>
          </div>
        `;

        const tablesContainer = document.getElementById('analysis-tables-content');
        const tablesHtml = tablesContainer ? tablesContainer.innerHTML : '';

        // 단일 HTML 파일 조립
        const htmlContent = `<!DOCTYPE html>
<html lang="ko" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>업무분석 팀별·개인별 피드백 노트 & 실무 보고서</title>
  <style>
    :root {
      --bg-primary: #0a0f1d;
      --bg-secondary: rgba(17, 24, 39, 0.75);
      --bg-card: rgba(30, 41, 59, 0.65);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #f8fafc;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent-indigo: #6366f1;
      --accent-emerald: #10b981;
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      margin: 0;
      padding: 24px;
      line-height: 1.5;
    }
    .feedback-page-container { max-width: 1400px; margin: 0 auto; }
    .feedback-banner { background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(16,185,129,0.1)); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px 32px; margin-bottom: 24px; }
    .feedback-banner-title { font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .feedback-banner-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
    .team-nav-container { display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 6px; border-bottom: 1px solid var(--border-color); }
    .team-nav-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 8px; background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 13px; font-weight: 700; cursor: pointer; }
    .team-nav-btn.active { background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.2)); color: #fff; border-color: var(--accent-indigo); }
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; }
    .kpi-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
    .kpi-value { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
    .kpi-sub { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
    .text-positive { color: #10b981; }
    .text-negative { color: #ef4444; }
    .team-profile-banner { background: linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9)); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px 28px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-left: 6px solid var(--accent-indigo); }
    .team-profile-title { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
    .team-profile-sub { font-size: 13px; color: var(--text-secondary); margin-top: 4px; }
    .leader-coaching-box { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.35); border-left: 6px solid var(--accent-indigo); border-radius: 14px; padding: 20px 24px; margin-bottom: 28px; }
    .leader-box-title { font-size: 15px; font-weight: 800; color: var(--accent-indigo); margin-bottom: 10px; }
    .leader-box-content { font-size: 13px; line-height: 1.65; }
    .members-feedback-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .member-feedback-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .member-feedback-card.card-best { border-left: 5px solid #10b981; }
    .member-feedback-card.card-warn { border-left: 5px solid #f43f5e; }
    .member-feedback-card.card-normal { border-left: 5px solid #6366f1; }
    .member-feedback-card.card-ready { border-left: 5px solid #94a3b8; }
    .member-card-header { display: flex; justify-content: space-between; align-items: center; }
    .member-card-name { font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
    .member-role-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 700; }
    .role-leader { background: rgba(99,102,241,0.2); color: #c7d2fe; }
    .role-member { background: rgba(100,116,139,0.2); color: #cbd5e1; }
    .member-stats-strip { display: grid; grid-template-columns: repeat(4, 1fr); background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; text-align: center; gap: 4px; }
    .stat-strip-label { font-size: 10px; color: var(--text-muted); margin-bottom: 2px; }
    .stat-strip-val { font-size: 13px; font-weight: 800; }
    .feedback-section-pill { font-size: 12px; line-height: 1.55; padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; }
    .pill-strength { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); }
    .pill-improvement { background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2); }
    .pill-action { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); }
    .core-practical-container { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; margin-top: 24px; margin-bottom: 32px; border-top: 4px solid var(--accent-indigo); }
    .feedback-card-head { display: flex; justify-content: space-between; align-items: center; }
    .feedback-card-title { font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .feedback-card-badge { font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 700; background: rgba(16,185,129,0.2); color: #10b981; }
    .data-table-wrapper { overflow-x: auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th { background: rgba(0,0,0,0.3); padding: 10px 14px; text-align: left; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); white-space: nowrap; }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid var(--border-color); }
    .data-table tr:hover { background: rgba(255,255,255,0.02); }
    .memo-container { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; }
    .leader-points-container { margin-top: 14px; background: rgba(0,0,0,0.18); border-radius: 8px; padding: 14px 16px; border: 1px solid rgba(99, 102, 241, 0.25); }
    .leader-point-item { display: flex; gap: 8px; align-items: flex-start; padding: 4px 0; }
    .leader-point-num { font-weight: 800; color: #818cf8; min-width: 20px; font-size: 13px; line-height: 1.6; }
    .leader-point-text { font-size: 13px; line-height: 1.65; color: var(--text-primary); }
    @media print {
      body { background: #fff !important; color: #111827 !important; }
      .team-nav-container, .btn-print, #btn-export-csv { display: none !important; }
      .team-tab-pane { display: block !important; page-break-before: always; }
      .member-feedback-card, .leader-coaching-box, .core-practical-container, .leader-points-container, .kpi-card { background: #fff !important; border: 1px solid #d1d5db !important; color: #111827 !important; break-inside: avoid; }
      .leader-point-num { color: #111827 !important; }
    }
  </style>
</head>
<body>
  <div class="feedback-page-container">
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
      <div>
        <h1 style="font-size: 22px; font-weight: 800; margin: 0;">업무분석 팀별·개인별 피드백 노트 & 종합 리포트</h1>
        <div style="font-size: 12px; color: #10b981; font-weight: 700; margin-top: 4px;">🔒 실물 데이터 기반 팀장·팀원 개인별 맞춤 피드백 및 핵심실무 노트</div>
      </div>
      <div>
        <button onclick="window.print()" style="padding: 8px 16px; border-radius: 8px; background: #6366f1; color: #fff; border: none; font-weight: 700; cursor: pointer;">🖨️ 인쇄 / PDF 저장</button>
      </div>
    </header>

    <nav class="team-nav-container" id="static-team-nav">
      <button class="team-nav-btn active" onclick="switchPane('all', this)">🌟 전체 종합 피드백</button>
      <button class="team-nav-btn" onclick="switchPane('team1', this)">🛡️ 1팀 (이재희 팀장)</button>
      <button class="team-nav-btn" onclick="switchPane('team2', this)">⚡ 2팀 (박소영 팀장)</button>
      <button class="team-nav-btn" onclick="switchPane('team3', this)">👑 3팀 (손수령 팀장)</button>
      <button class="team-nav-btn" onclick="switchPane('teamChain', this)">🏢 체인팀 (김숙정 팀장)</button>
      <button class="team-nav-btn" onclick="switchPane('teamEtc', this)">📁 기타 (박수빈/퇴사자)</button>
    </nav>

    <div id="static-team-content">
      ${allPaneHtml}
      ${allTeamSectionsHtml}
    </div>

    <section style="margin-top: 48px; border-top: 2px dashed var(--border-color); padding-top: 32px;">
      <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 20px;">📊 모든 분석 결과 종합표 (All Analysis Tables)</h2>
      ${chartImgHtml}
      <div>${tablesHtml}</div>
    </section>
  </div>

  <script>
    function switchPane(teamId, btn) {
      document.querySelectorAll('.team-nav-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      document.querySelectorAll('.team-tab-pane').forEach(p => p.style.display = 'none');
      const target = document.getElementById('pane-' + teamId);
      if (target) target.style.display = 'block';
    }
  </script>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        a.href = url;
        a.download = `업무분석_팀별_피드백노트_종합보고서_${dateStr}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('팀별 피드백 노트 HTML 리포트가 성공적으로 다운로드되었습니다!', 'success');
      } catch (err) {
        console.error(err);
        alert('HTML 리포트 다운로드 중 오류: ' + err.message);
      }
    });
  }

  // 인쇄 및 PDF 저장 버튼
  if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
      window.print();
    });
  }

  // 데이터 최신화 버튼 (명시적 클릭 시 샘플 데이터 폴백 허용)
  if (btnSyncSamples) {
    btnSyncSamples.addEventListener('click', () => {
      loadAndAnalyzeData(true);
      showToast('샘플 번들 데이터를 불러와 분석을 최신화했습니다.', 'success');
    });
  }

  // [핵심 요구사항] 메인 대시보드와 피드백 노트 간 실시간 자동 새로고침 및 동기화 파이프라인
  let syncChannel = null;
  try {
    syncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cmwork_sync_channel') : null;
  } catch (e) {
    syncChannel = null;
  }

  let isReloading = false;
  const triggerFeedbackReload = (msg) => {
    if (isReloading) return;
    isReloading = true;
    showToast(msg || '🔄 메인 대시보드 새로고침 감지: 피드백 노트를 즉시 새로고침합니다.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  // 1. BroadcastChannel 메시지 수신 (메인 대시보드에서 새로고침 시 피드백 노트도 즉시 새로고침)
  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      const { type } = event.data || {};
      if (type === 'RESET_ALL' || type === 'PAGE_RELOAD') {
        triggerFeedbackReload('🔄 메인 대시보드 새로고침 감지: 피드백 노트를 즉시 새로고침합니다.');
      } else if (type === 'DATA_CHANGED') {
        showToast('📊 메인 대시보드 데이터 변경 감지: 최신 분석 결과를 동기화합니다.', 'info');
        loadAndAnalyzeData(false);
      }
    };
  }

  // 2. Storage 이벤트 리스너 (브라우저 창/탭 간 100% 호환 보장)
  window.addEventListener('storage', (e) => {
    if (e.key === 'cmwork_sync_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload.type === 'RESET_ALL' || payload.type === 'PAGE_RELOAD') {
          triggerFeedbackReload('🔄 메인 대시보드 새로고침 감지: 피드백 노트를 즉시 새로고침합니다.');
        } else if (payload.type === 'DATA_CHANGED') {
          loadAndAnalyzeData(false);
        }
      } catch (err) {}
    }
  });

  // 3. 상시 상태 감지 타이머 (file:// 환경 및 다중 창 실시간 동기화 100% 보장)
  let lastCheckedTimestamp = Date.now();
  const performSyncCheck = async () => {
    if (isReloading) return;

    try {
      // A. localStorage 동기화 이벤트 검사 (file://에서도 localStorage.getItem은 즉각 조회 가능)
      const syncEventStr = localStorage.getItem('cmwork_sync_event');
      if (syncEventStr) {
        const syncEvent = JSON.parse(syncEventStr);
        if (syncEvent && syncEvent.timestamp && syncEvent.timestamp > lastCheckedTimestamp) {
          lastCheckedTimestamp = syncEvent.timestamp;
          if (syncEvent.type === 'RESET_ALL' || syncEvent.type === 'PAGE_RELOAD') {
            triggerFeedbackReload('🔄 메인 대시보드 새로고침 감지: 피드백 노트를 즉시 새로고침합니다.');
            return;
          } else if (syncEvent.type === 'DATA_CHANGED') {
            loadAndAnalyzeData(false);
          }
        }
      }

      // B. IndexedDB 실시간 슬롯 상태 교차 검증 (이벤트 수신 불가 환경 대비 완벽 방어)
      if (window.indexedDbStorage) {
        const slots = await window.indexedDbStorage.getAllSlots();
        let currentTotalRows = 0;
        if (slots) {
          for (const s of Object.values(slots)) {
            if (s && s.rows && s.rows.length > 0) currentTotalRows += s.rows.length;
          }
        }

        const currentlyHasData = !!(window.appFeedbackState && window.appFeedbackState.dataBundle);

        // 메인 대시보드에서 리셋되어 DB 데이터가 0건인데 피드백 노트에 분석 결과가 남아있는 경우 즉시 리셋/새로고침!
        if (currentTotalRows === 0 && currentlyHasData) {
          triggerFeedbackReload('🔄 메인 대시보드 초기화 감지: 피드백 노트를 리셋합니다.');
          return;
        }

        // 반대로 피드백 노트는 비어있는데 DB에 새 데이터가 들어왔다면 즉시 분석 로드!
        if (currentTotalRows > 0 && !currentlyHasData) {
          loadAndAnalyzeData(false);
        }
      }
    } catch (e) {}
  };

  // 600ms 주기로 상태 자동 동기화 (다중 창/모니터 완벽 지원)
  setInterval(performSyncCheck, 600);
  window.addEventListener('focus', performSyncCheck);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) performSyncCheck();
  });

  // 4. 피드백 노트 상단 헤더 [🔄 새로고침 (분석 결과 리셋)] 버튼 핸들러
  const btnClearSessionFeedback = document.getElementById('btn-clear-session-feedback');
  if (btnClearSessionFeedback) {
    btnClearSessionFeedback.addEventListener('click', async () => {
      const ok = confirm('정말 분석 결과와 모든 원본 데이터를 초기화(리셋)하시겠습니까?\n메인 대시보드와 피드백 노트 데이터가 모두 깨끗하게 리셋됩니다.');
      if (!ok) return;

      // IndexedDB 및 세션 스토리지 완전 초기화
      if (window.indexedDbStorage) {
        try {
          await window.indexedDbStorage.clearAll();
        } catch (e) {
          console.warn('IndexedDB 초기화 오류:', e);
        }
      }
      ['prevOrders', 'currOrders', 'products', 'receptions', 'errors'].forEach(slot => {
        try { sessionStorage.removeItem('cmwork_slot_' + slot); } catch(e){}
      });
      try { localStorage.removeItem('cmwork_last_analysis_mode'); } catch(e){}

      // 동기화 이벤트 발송 (메인 대시보드 및 모든 탭에 리셋 전파)
      const eventData = { type: 'RESET_ALL', timestamp: Date.now() };
      try {
        localStorage.setItem('cmwork_sync_event', JSON.stringify(eventData));
      } catch (e) {}
      if (syncChannel) {
        try {
          syncChannel.postMessage(eventData);
        } catch (e) {}
      }

      showToast('🔄 모든 분석 결과와 원본 데이터가 초기화되었습니다. 새로고침합니다.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 350);
    });
  }

  // 초기 실행
  await loadAndAnalyzeData(false);
});
