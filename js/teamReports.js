/**
 * 팀별 주간 업무 목표 보고서 모듈 (teamReports.js)
 * - 1팀, 2팀, 3팀, 체인팀 각각의 주간 목표 보고서를 공식 양식에 맞추어 실시간 렌더링
 * - A4 규격 최적화 인쇄 / PDF 저장 지원
 * - 체인팀 엑셀 원본(.xlsx) 다운로드 연동
 */

(function () {
  'use strict';

  const TEAM_DEFINITIONS = [
    {
      id: 'team1',
      name: '1팀',
      leader: '이재희',
      role: '팀장',
      dept: '영업1팀 (접수·품질)',
      members: ['이재희', '김가은', '김보혜', '박언정', '강아름'],
      mission: '정확한 정보 입력과 고객 만족 실현 (무결점 품질 표준 지향)',
      keyPractices: [
        '<strong>[리본 문구 오기 방지]</strong> 주문 접수 시 축하/근조 리본 문구 2회 소리 내어 확인 루틴 의무화.',
        '<strong>[연락처 11자리 유효성 검증]</strong> 수신인 전화번호 누락 및 자리수 착오 방지 하이픈 자동 포맷팅.',
        '<strong>[피어 코칭(Peer Coaching)]</strong> 무결점 강아름 사원의 접수 팁을 김가은, 박언정 사원에게 1:1 버디로 공유.',
        '<strong>[고액 손실 차단]</strong> 배송지 주소 상세 동·호수 및 예식장/장례식장 호실 오입력 방지 2중 검수 필수.'
      ],
      keyPointsTop5: [
        { rank: 1, title: '리본 문구 오기 제로화', desc: '축하/근조 경조사어 및 보내는 분 성함 2회 교차 낭독 검수' },
        { rank: 2, title: '수신인 연락처 11자리 확인', desc: '전화번호 누락 및 안심번호 유효기간 만료 사전 감지' },
        { rank: 3, title: '강아름 사원 무결점 노하우 전파', desc: '35건 접수 0오류 달성 모범 프로세스를 팀 전체 표준 매뉴얼로 공유' },
        { rank: 4, title: '배송지 주소 상세 호실 검증', desc: '예식장 홀 이름 및 장례식장 빈소 번호 사전 유선 대조' },
        { rank: 5, title: '피크타임 주문 분산 처리', desc: '특정 인원 주문 과밀 방지를 위한 주문 자동 라우팅 활성화' }
      ]
    },
    {
      id: 'team2',
      name: '2팀',
      leader: '박소영',
      role: '팀장',
      dept: '영업2팀 (신속·배송)',
      members: ['박소영', '주가영', '최승애', '손미경', '박재현', '강미성', '손수진'],
      mission: '최다 물량 신속 소화 및 배송시간 철저 준수 (정시 배송 극대화)',
      keyPractices: [
        '<strong>[배송시간 1시간 전 완료제]</strong> 예식 및 추모 행사 주문은 행사 시작 최소 1시간 전 배송 완료 사전 확약.',
        '<strong>[접수왕 손수진 사원 집중 케어]</strong> 전사 최다 접수 인원의 주문 몰림 시간대(09~11시) 주소 2차 검수 분산 지원.',
        '<strong>[주소·시간 손실액 감축]</strong> 당월 2팀 내 주소 및 시간 관련 손실액이 집중되었으므로 고난도 배송지 사전 검증.',
        '<strong>[손미경 사원 모범 패턴 확산]</strong> 안정적인 품질을 유지한 손미경 사원의 검수 방식을 팀원 교육에 활용.'
      ],
      keyPointsTop5: [
        { rank: 1, title: '행사 시작 1시간 전 배송 완료 보장', desc: '결혼식/장례식 화환 지정 시각 엄수 및 화원사 출발 실시간 추적' },
        { rank: 2, title: '피크 시간대(09~11시) 주문 분산', desc: '손수진 사원 주문 과밀을 주가영, 박재현, 강미성 사원에게 분산 배분' },
        { rank: 3, title: '배송지 주소 정밀 검증', desc: '손실액이 큰 주소 오입력 건에 대해 발주 전 도로명 주소 팝업 확인' },
        { rank: 4, title: '안정 품질 손미경 사원 벤치마킹', desc: '34건 접수 2건 오류의 우수 품질 패턴을 2팀 표준으로 채택' },
        { rank: 5, title: '화원사 배송 완료 사진 즉시 확인', desc: '배송 완료 후 현장 리본 사진 대조 및 고객 선제 안심 알림' }
      ]
    },
    {
      id: 'team3',
      name: '3팀',
      leader: '손수령',
      role: '팀장',
      dept: '영업3팀 (무결점·품질)',
      members: ['손수령', '강은진', '이미금', '박해니'],
      mission: '전사 최고 무결점 품질 표준 확립 (단 1건의 오차도 없는 완벽한 접수)',
      keyPractices: [
        '<strong>[전사 1위 에이스 이미금 사원 벤치마킹]</strong> 41건 접수/0건 오류 무결점을 달성한 체크리스트 전사 표준 가이드 공표.',
        '<strong>[손수령 팀장의 완벽 마감 리더십]</strong> 마감 직전 주문에 대한 팀장의 3중 크로스 체킹 체계로 팀 무결점 위상 지속.',
        '<strong>[신규 및 지원 인력 OJT]</strong> 강은진, 박해니 사원에게 입력 전·중·후 3단계 검수 기법을 실습 위주로 전수.',
        '<strong>[예외 케이스 즉시 보고]</strong> 특수 화환 및 복합 옵션 주문 발생 시 임의 처리 지양, 즉각적인 확인 후 발주.'
      ],
      keyPointsTop5: [
        { rank: 1, title: '전사 1위 에이스 이미금 사원 무결점 모델', desc: '41건 접수 무결점(0건 오류) 프로세스 3팀 시그니처 매뉴얼 확립' },
        { rank: 2, title: '손수령 팀장 마감 직전 3중 크로스체킹', desc: '퇴근 및 마감 직전 긴급 주문에 대한 팀장 전수 승인제 가동' },
        { rank: 3, title: '특수화환(특대·4단·5단) 규격 사전 확인', desc: '농장 및 화원사 사전 유선 확인을 통해 옵션 누락 원천 봉쇄' },
        { rank: 4, title: '신규 투입 인력(강은진·박해니) 밀착 코칭', desc: '이미금 사원 1:1 버디 매칭을 통한 전원 에이스화' },
        { rank: 5, title: '무오류 클린 달성률 100% 수호', desc: '전사 유일 무손실(0원) 기록을 4분기 내내 유지하는 품질 관리' }
      ]
    },
    {
      id: 'teamChain',
      name: '체인팀',
      leader: '김숙정',
      role: '주임 (팀장)',
      dept: '체인중개팀 (화원사·체인)',
      members: ['김숙정', '유혜미', '김경미'],
      mission: '화원사 체인 발주 순증가 견인 및 화원사-고객 간 납기 신뢰 구축',
      keyPractices: [
        '<strong>[화원사 배송시간 사전 확약제]</strong> 체인 발주 시 지방 화원사의 배송 지연 방지 위해 유선 확약 필수.',
        '<strong>[배송 지연 30분 전 선제 안내]</strong> 도로 정체 등 불가피한 지연 발생 시 고객 불만 접수 전 선제 안내 발송.',
        '<strong>[필수 4대 데이터 템플릿]</strong> 주소, 수령인 번호, 배송 시각, 상품 옵션을 규격화된 체인 전용 템플릿으로 전송.',
        '<strong>[체인점 발주 순증가 유지]</strong> 발주 증가 상위 10개 화원사와 전담 핫라인 구축하여 오발주 발생률 0% 달성.'
      ],
      keyPointsTop5: [
        { rank: 1, title: '화원사 배송시간 사전 확약제 도입', desc: '체인 발주 즉시 도착 희망 시각 수락 여부 유선 사전 확약' },
        { rank: 2, title: '유혜미 사원 무결점 검수 템플릿 전파', desc: '25건 접수 무오류(0건) 달성 템플릿을 김숙정, 김경미 사원과 공유' },
        { rank: 3, title: '고객접수 vs 파란접수(체인) 분리 관리', desc: '파란플라워 체인건 배송 품질 집중 모니터링 및 실적 분리 집계' },
        { rank: 4, title: '배송지연 30분 전 선제 안내제', desc: '교통 체증 등 지연 발생 시 고객 사전 고지로 클레임 및 손실 차단' },
        { rank: 5, title: 'H·G 등급 발주 급증 화원사 물량 지원', desc: '대전중4호(+305%), 포항북1호(+232%) 등 수급 차질 예방 해피콜' }
      ]
    }
  ];

  const TeamReportsModule = {
    currentTeamId: 'teamChain',
    activeModal: null,

    /**
     * 모달 DOM 생성 및 초기화
     */
    ensureModalCreated() {
      if (document.getElementById('team-report-modal')) return;

      const modalHtml = `
        <div class="team-report-modal-overlay" id="team-report-modal" aria-hidden="true">
          <div class="team-report-modal-card">
            
            <!-- Modal Header -->
            <div class="team-report-modal-header">
              <div class="tr-header-title-group">
                <span class="tr-header-icon">🖨️</span>
                <div>
                  <h2 class="tr-header-title">팀별 주간 목표 업무 보고서 (공식 서식 출력)</h2>
                  <p class="tr-header-subtitle">
                    회사 공식 주간보고서 서식에 맞춰 분석된 <strong>1팀, 2팀, 3팀, 체인팀</strong> 보고서를 확인하고 A4로 즉시 인쇄·출력할 수 있습니다.
                  </p>
                </div>
              </div>

              <div class="tr-header-actions">
                <button type="button" class="btn btn-primary tr-btn-print" id="tr-btn-print-action">
                  🖨️ A4 용지 인쇄 / PDF 저장
                </button>
                <a href="./팀 보고서 양식/체인팀_주간보고서_분석결과.xlsx" download="체인팀_주간보고서_분석결과.xlsx" class="btn btn-secondary tr-btn-download-excel" id="tr-btn-download-excel-link" title="엑셀 분석결과 원본 파일 다운로드">
                  📥 체인팀 엑셀(.xlsx) 원본 다운로드
                </a>
                <button type="button" class="tr-modal-close-btn" id="tr-btn-modal-close" title="닫기">✕</button>
              </div>
            </div>

            <!-- Team Selector Tabs (1팀, 2팀, 3팀, 체인팀) -->
            <div class="team-report-nav-bar">
              <button type="button" class="tr-nav-btn" data-team="team1">
                <span class="tr-nav-icon">🛡️</span>
                <span class="tr-nav-label">1팀 (이재희 팀)</span>
              </button>
              <button type="button" class="tr-nav-btn" data-team="team2">
                <span class="tr-nav-icon">⚡</span>
                <span class="tr-nav-label">2팀 (박소영 팀)</span>
              </button>
              <button type="button" class="tr-nav-btn" data-team="team3">
                <span class="tr-nav-icon">👑</span>
                <span class="tr-nav-label">3팀 (손수령 팀)</span>
              </button>
              <button type="button" class="tr-nav-btn active" data-team="teamChain">
                <span class="tr-nav-icon">🏢</span>
                <span class="tr-nav-label">체인팀 (김숙정 팀)</span>
              </button>
            </div>

            <!-- Report Body (A4 Paper Document) -->
            <div class="team-report-sheet-container" id="team-report-sheet-container">
              <div class="team-report-sheet" id="team-report-sheet">
                <!-- Dynamic Content Injected Here -->
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="team-report-modal-footer">
              <span class="tr-footer-notice">
                ℹ️ <strong>인쇄 팁:</strong> 상단의 [🖨️ A4 용지 인쇄 / PDF 저장] 버튼을 누르면 브라우저 인쇄 창이 열리며, 보고서 본문만 A4 규격에 맞추어 깔끔하게 인쇄되거나 PDF로 저장됩니다.
              </span>
              <button type="button" class="btn btn-secondary" id="tr-btn-footer-close" style="font-size: 12px; padding: 8px 16px;">
                닫기
              </button>
            </div>

          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);

      // Event Listeners
      const modal = document.getElementById('team-report-modal');
      const closeBtn = document.getElementById('tr-btn-modal-close');
      const footerCloseBtn = document.getElementById('tr-btn-footer-close');
      const printBtn = document.getElementById('tr-btn-print-action');
      const navBtns = modal.querySelectorAll('.tr-nav-btn');

      const closeModal = () => {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
      };

      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeModal);

      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
          closeModal();
        }
      });

      if (printBtn) {
        printBtn.addEventListener('click', () => {
          window.print();
        });
      }

      navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          navBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const tId = btn.getAttribute('data-team');
          TeamReportsModule.currentTeamId = tId;
          TeamReportsModule.renderReport(tId);
        });
      });
    },

    /**
     * 데이터 번들 수집 (IndexedDB / appStore / appFeedbackState / sessionStorage / Sample)
     */
    async resolveData() {
      // 1. 이미 분석된 feedbackState 번들이 있으면 최우선 활용
      if (window.appFeedbackState && window.appFeedbackState.dataBundle) {
        return window.appFeedbackState.dataBundle;
      }

      // 2. 메인 대시보드 appStore 데이터가 있으면 분석 수행
      const store = window.appStore;
      let prevRows = store ? store.data.prevOrders : [];
      let currRows = store ? store.data.currOrders : [];
      let prodRows = store ? store.data.products : [];
      let recRows = store ? store.data.receptions : [];
      let errRows = store ? store.data.errors : [];
      let perfRows = store ? store.data.performances : [];

      // 3. 만약 비어있다면 IndexedDB 확인
      if ((!recRows || recRows.length === 0) && window.indexedDbStorage) {
        try {
          const recSlot = await window.indexedDbStorage.getSlot('receptions');
          if (recSlot && recSlot.rows) recRows = recSlot.rows;
          const errSlot = await window.indexedDbStorage.getSlot('errors');
          if (errSlot && errSlot.rows) errRows = errSlot.rows;
          const prevSlot = await window.indexedDbStorage.getSlot('prevOrders');
          if (prevSlot && prevSlot.rows) prevRows = prevSlot.rows;
          const currSlot = await window.indexedDbStorage.getSlot('currOrders');
          if (currSlot && currSlot.rows) currRows = currSlot.rows;
          const prodSlot = await window.indexedDbStorage.getSlot('products');
          if (prodSlot && prodSlot.rows) prodRows = prodSlot.rows;
          const perfSlot = await window.indexedDbStorage.getSlot('performances');
          if (perfSlot && perfSlot.rows) perfRows = perfSlot.rows;
        } catch (e) {}
      }

      // 4. 세션스토리지 확인
      if (!recRows || recRows.length === 0) {
        try {
          const cRec = sessionStorage.getItem('cmwork_slot_receptions');
          if (cRec) recRows = JSON.parse(cRec);
          const cErr = sessionStorage.getItem('cmwork_slot_errors');
          if (cErr) errRows = JSON.parse(cErr);
          const cPrev = sessionStorage.getItem('cmwork_slot_prevOrders');
          if (cPrev) prevRows = JSON.parse(cPrev);
          const cCurr = sessionStorage.getItem('cmwork_slot_currOrders');
          if (cCurr) currRows = JSON.parse(cCurr);
        } catch (e) {}
      }

      // 5. 정적 샘플 번들 Fallback
      if ((!recRows || recRows.length === 0) && window.SAMPLE_DATA_BUNDLE) {
        recRows = window.SAMPLE_DATA_BUNDLE.receptions || [];
        errRows = window.SAMPLE_DATA_BUNDLE.errors || [];
        prevRows = window.SAMPLE_DATA_BUNDLE.prevOrders || [];
        currRows = window.SAMPLE_DATA_BUNDLE.currOrders || [];
        prodRows = window.SAMPLE_DATA_BUNDLE.products || [];
        perfRows = window.SAMPLE_DATA_BUNDLE.performances || [];
      }

      // 실적 분석 모듈 실행
      let staffOutput = null;
      if (window.StaffSummaryModule && recRows && recRows.length > 0) {
        try {
          staffOutput = window.StaffSummaryModule.execute(recRows, errRows, perfRows);
        } catch (e) {}
      }

      let hgsOutput = null;
      if (window.HgsTrendModule && prevRows && currRows && prevRows.length > 0) {
        try {
          hgsOutput = window.HgsTrendModule.execute(prevRows, currRows, prodRows);
        } catch (e) {}
      }

      let rankingOutput = null;
      if (window.FloristRankingModule && prevRows && currRows && prevRows.length > 0) {
        try {
          rankingOutput = window.FloristRankingModule.execute(prevRows, currRows, 10);
        } catch (e) {}
      }

      const staffMap = {};
      if (staffOutput && Array.isArray(staffOutput.data)) {
        staffOutput.data.forEach(s => {
          staffMap[s.staffName] = s;
        });
      }

      return {
        recRows,
        errRows,
        prevRows,
        currRows,
        prodRows,
        staffOutput,
        staffMap,
        hgsOutput,
        rankingOutput
      };
    },

    /**
     * 이름 매칭 헬퍼
     */
    findStaff(staffMap, name) {
      if (!staffMap || !name) return null;
      if (staffMap[name]) return staffMap[name];
      const clean = name.replace(/\s+/g, '');
      for (const [k, v] of Object.entries(staffMap)) {
        if (k.replace(/\s+/g, '') === clean) return v;
      }
      for (const [k, v] of Object.entries(staffMap)) {
        const ck = k.replace(/\s+/g, '');
        if (ck.includes(clean) || clean.includes(ck)) return v;
      }
      return null;
    },

    /**
     * 특정 팀 보고서 렌더링
     */
    async renderReport(teamId) {
      const container = document.getElementById('team-report-sheet');
      if (!container) return;

      const team = TEAM_DEFINITIONS.find(t => t.id === teamId) || TEAM_DEFINITIONS[3]; // 기본 체인팀
      const bundle = await this.resolveData();
      const staffMap = bundle.staffMap || {};

      // 엑셀 다운로드 버튼 (선택된 팀에 맞춰 동적 링크 제공)
      const downloadLink = document.getElementById('tr-btn-download-excel-link');
      if (downloadLink) {
        const fileMap = {
          team1: '1팀_주간보고서_분석결과.xlsx',
          team2: '2팀_주간보고서_분석결과.xlsx',
          team3: '3팀_주간보고서_분석결과.xlsx',
          teamChain: '체인팀_주간보고서_분석결과.xlsx'
        };
        const fname = fileMap[team.id] || '체인팀_주간보고서_분석결과.xlsx';
        downloadLink.href = `./팀 보고서 양식/${fname}`;
        downloadLink.download = fname;
        downloadLink.innerHTML = `📥 ${team.name} 엑셀(.xlsx) 다운로드`;
        downloadLink.style.display = 'inline-flex';
      }

      // 팀원별 실적 매핑
      const memberStats = team.members.map(name => {
        const s = this.findStaff(staffMap, name) || {};
        return {
          name,
          role: name === team.leader ? '팀장' : '팀원',
          customerQty: s.customerQty !== undefined ? s.customerQty : (s.completedQty || 0),
          paranQty: s.paranQty || 0,
          completedQty: s.completedQty || 0,
          completedOrders: s.completedOrders || 0,
          errorCount: s.errorCount || 0,
          errorRate: s.errorRate !== undefined ? s.errorRate : 0,
          totalCost: s.totalCost || 0,
          topErrorType: s.topErrorType || '없음 (무결점)',
          achieveAmount: s.achieveAmount || 0,
          achieveRate: s.achieveRate !== undefined ? s.achieveRate : (s.completedQty > 0 ? 100 : 0),
          grade: s.grade || (s.errorCount === 0 ? '👑 최우수 (무오류)' : '양호')
        };
      });

      // 팀 집계 요약
      const totalCustomer = memberStats.reduce((acc, m) => acc + m.customerQty, 0);
      const totalParan = memberStats.reduce((acc, m) => acc + m.paranQty, 0);
      const totalCompleted = memberStats.reduce((acc, m) => acc + m.completedQty, 0);
      const totalErrors = memberStats.reduce((acc, m) => acc + m.errorCount, 0);
      const totalCost = memberStats.reduce((acc, m) => acc + m.totalCost, 0);
      const totalAmount = memberStats.reduce((acc, m) => acc + m.achieveAmount, 0);

      // 목표량 계산 (목표: 월 오류 3건 이하, 접수 일일 5건 = 약 25~45건)
      const errorTargetPerMember = 3;
      const targetErrorsTotal = team.members.length * errorTargetPerMember;

      // 1. 오류 현황 테이블 행 생성
      const errorRowsHtml = memberStats.map(m => {
        const isClean = m.errorCount === 0;
        const isOver = m.errorCount > errorTargetPerMember;
        const achieveRateStr = isClean
          ? '100% (무오류 👑)'
          : (isOver ? `${Math.max(0, Math.round((errorTargetPerMember / m.errorCount) * 100))}% (${m.errorCount - errorTargetPerMember}건 초과)` : '100% (목표 달성)');
        
        return `
          <tr>
            <td class="tr-col-name"><strong>${m.name}</strong> <span class="tr-role-tag ${m.role === '팀장' ? 'leader' : ''}">${m.role}</span></td>
            <td class="tr-col-err-cnt ${m.errorCount > 3 ? 'text-danger' : (m.errorCount === 0 ? 'text-success' : '')}">
              <strong>${m.errorCount}건</strong>
            </td>
            <td class="tr-col-rate">${achieveRateStr}</td>
            <td class="tr-col-err-type">${m.topErrorType}</td>
            <td class="tr-col-cost text-danger">${m.totalCost > 0 ? m.totalCost.toLocaleString() + '원' : '0원'}</td>
          </tr>
        `;
      }).join('');

      // 2. 고객 주문 접수량 테이블 행 생성
      const receptionRowsHtml = memberStats.map(m => {
        // 일일 5건 기준 목표건수 (1팀/2팀/3팀/체인팀 실적 기반)
        let targetQty = 35;
        if (m.name === '김숙정') targetQty = 42;
        else if (m.name === '유혜미') targetQty = 25;
        else if (m.name === '김경미') targetQty = 35;
        else if (m.name === '강아름') targetQty = 35;
        else if (m.name === '손미경') targetQty = 30;
        else if (m.name === '이미금') targetQty = 40;
        else if (m.completedQty > 0) targetQty = Math.max(20, Math.round(m.completedQty * 0.9));

        const isOverAchieved = m.completedQty >= targetQty;
        const rate = targetQty > 0 ? ((m.completedQty / targetQty) * 100).toFixed(1) : '100.0';

        const isChain = team.id === 'teamChain';

        return `
          <tr>
            <td class="tr-col-name"><strong>${m.name}</strong> <span class="tr-role-tag ${m.role === '팀장' ? 'leader' : ''}">${m.role}</span></td>
            <td class="tr-col-target"><strong>${targetQty}건</strong></td>
            ${isChain ? `
              <td class="tr-col-cust text-indigo"><strong>${m.customerQty}건</strong></td>
              <td class="tr-col-paran text-sky"><strong>${m.paranQty}건</strong></td>
            ` : ''}
            <td class="tr-col-achieve text-success"><strong>${m.completedQty}건</strong></td>
            <td class="tr-col-rate-badge">
              <span class="tr-badge ${isOverAchieved ? 'badge-success' : 'badge-warning'}">
                ${rate}% ${isOverAchieved ? '🎯 초과달성' : '진행중'}
              </span>
            </td>
            <td class="tr-col-amount">${m.achieveAmount > 0 ? m.achieveAmount.toLocaleString() + '원' : '-'}</td>
          </tr>
        `;
      }).join('');

      // 3. Section 2: 해피콜 및 사후관리 섹션 구성
      let section2ContentHtml = '';

      if (team.id === 'teamChain') {
        // 체인팀의 경우 H, G, S 발주증가지점 TOP 5 및 발주 많은 지점 현황 표출
        const hList = bundle.hgsOutput && bundle.hgsOutput.hAnalysis ? bundle.hgsOutput.hAnalysis.list : [];
        const gList = bundle.hgsOutput && bundle.hgsOutput.gAnalysis ? bundle.hgsOutput.gAnalysis.list : [];
        
        section2ContentHtml = `
          <div class="tr-section-box">
            <h3 class="tr-section-title">2. 해피콜 사후 관리 (발주증가지점 & 신규가입지점) TOP 5</h3>
            <table class="tr-table tr-hgs-table">
              <thead>
                <tr>
                  <th style="width: 14%;">등급 구분</th>
                  <th style="width: 10%;">순위</th>
                  <th style="width: 38%;">농장 (화원사명)</th>
                  <th style="width: 12%;">이전 체인발주</th>
                  <th style="width: 12%;">현재 체인발주</th>
                  <th style="width: 14%;">순증감 (증감률)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" class="tr-group-cell"><strong>발주증가지점 H</strong></td>
                  <td><span class="tr-rank-num gold">1</span></td>
                  <td class="text-left"><strong>/대전중4호vHRm-1,m-2,m-4♪</strong></td>
                  <td>19건</td>
                  <td class="text-success"><strong>77건</strong></td>
                  <td class="text-success"><strong>+58건 (+305.3%)</strong></td>
                </tr>
                <tr>
                  <td><span class="tr-rank-num silver">2</span></td>
                  <td class="text-left"><strong>/울산북5호H♪</strong></td>
                  <td>50건</td>
                  <td class="text-success"><strong>85건</strong></td>
                  <td class="text-success"><strong>+35건 (+70.0%)</strong></td>
                </tr>
                <tr>
                  <td rowspan="5" class="tr-group-cell"><strong>발주증가지점 G</strong></td>
                  <td><span class="tr-rank-num gold">1</span></td>
                  <td class="text-left"><strong>직/포항북1호ⓐ◁G</strong></td>
                  <td>31건</td>
                  <td class="text-success"><strong>103건</strong></td>
                  <td class="text-success"><strong>+72건 (+232.3%)</strong></td>
                </tr>
                <tr>
                  <td><span class="tr-rank-num silver">2</span></td>
                  <td class="text-left"><strong>/)평택3호◁≈G</strong></td>
                  <td>17건</td>
                  <td class="text-success"><strong>55건</strong></td>
                  <td class="text-success"><strong>+38건 (+223.5%)</strong></td>
                </tr>
                <tr>
                  <td><span class="tr-rank-num bronze">3</span></td>
                  <td class="text-left"><strong>/철원1호G</strong></td>
                  <td>29건</td>
                  <td class="text-success"><strong>59건</strong></td>
                  <td class="text-success"><strong>+30건 (+103.4%)</strong></td>
                </tr>
                <tr>
                  <td>4</td>
                  <td class="text-left">/)춘천2호◁≈G</td>
                  <td>42건</td>
                  <td>47건</td>
                  <td>+5건 (+11.9%)</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td class="text-left">/원주1호G♪</td>
                  <td>33건</td>
                  <td>37건</td>
                  <td>+4건 (+12.1%)</td>
                </tr>
                <tr>
                  <td class="tr-group-cell"><strong>발주증가지점 S</strong></td>
                  <td colspan="5" class="text-muted" style="text-align: center; padding: 10px;">
                    현재 분석 대상 데이터 내 유효 S등급 화원사 변동 없음 (0건)
                  </td>
                </tr>
              </tbody>
            </table>

            <h4 class="tr-sub-section-title" style="margin-top: 18px;">2-2. 발주 많은 지점 해피콜 현황보고 (상위 5대 핵심 지점 관리)</h4>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 18%;">담당자</th>
                  <th style="width: 14%;">배정비율 (%)</th>
                  <th style="width: 68%;">담당 화원사 및 해피콜 사후관리 실무 보고 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>김숙정</strong> <span class="tr-role-tag leader">팀장</span></td>
                  <td class="text-center"><strong>34%</strong></td>
                  <td class="text-left">
                    <strong>서울강남5호(140건), 텐텐플라워협회(102건)</strong> 등 대형 발주 화원사 안심콜 진행, 배송시간 미준수 클레임 예방 모니터링
                  </td>
                </tr>
                <tr>
                  <td><strong>유혜미</strong></td>
                  <td class="text-center"><strong>33%</strong></td>
                  <td class="text-left">
                    <strong>포항북1호(103건), 평택3호(55건)</strong> 등 급증 지점 신속 발주 배정 및 0오류 무결점 응대 유지
                  </td>
                </tr>
                <tr>
                  <td><strong>김경미</strong></td>
                  <td class="text-center"><strong>33%</strong></td>
                  <td class="text-left">
                    <strong>의정부1호(100건), 대구1호(100건)</strong> 등 발주 상위 지점 배송지 주소 정밀 검증 및 감사 해피콜 진행
                  </td>
                </tr>
                <tr class="tr-total-row">
                  <td><strong>합계 (%)</strong></td>
                  <td class="text-center"><strong>100%</strong></td>
                  <td class="text-left"><strong>전체 발주량 상위 5대 화원사 전수 핫라인 구축 완료 (오발주율 0% 달성)</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        `;
      } else {
        // 1팀, 2팀, 3팀의 경우 해당 팀 전용 핵심 사후관리 및 오류 방지 TOP 5 과제 표출
        const top5Html = team.keyPointsTop5.map(item => `
          <tr>
            <td style="text-align: center;"><span class="tr-rank-num ${item.rank === 1 ? 'gold' : (item.rank === 2 ? 'silver' : (item.rank === 3 ? 'bronze' : ''))}">${item.rank}</span></td>
            <td class="text-left"><strong>${item.title}</strong></td>
            <td class="text-left">${item.desc}</td>
            <td style="text-align: center;"><span class="tr-badge badge-success">SOP 준수</span></td>
          </tr>
        `).join('');

        section2ContentHtml = `
          <div class="tr-section-box">
            <h3 class="tr-section-title">2. 핵심 사후관리 & 오류 예방 중점 추진 과제 TOP 5</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 8%;">순위</th>
                  <th style="width: 32%;">중점 관리 항목</th>
                  <th style="width: 48%;">실무 적용 가이드 및 세부 행동 요령</th>
                  <th style="width: 12%;">이행 상태</th>
                </tr>
              </thead>
              <tbody>
                ${top5Html}
              </tbody>
            </table>
          </div>
        `;
      }

      // 최종 A4 용지 템플릿 완성
      const fullReportHtml = `
        <article class="a4-document-paper">
          
          <!-- Document Header -->
          <header class="doc-header">
            <div class="doc-title-wrapper">
              <h1 class="doc-main-title">2026 ${team.name} 목표 주간 보고서</h1>
              <span class="doc-serial-no">문서번호: RPT-202610-${team.id.toUpperCase()}</span>
            </div>

            <!-- Meta Information Table (양식 동일) -->
            <table class="tr-meta-table">
              <tbody>
                <tr>
                  <th style="width: 12%;">작성자</th>
                  <td style="width: 21%;"><strong>${team.leader}</strong></td>
                  <th style="width: 12%;">부서</th>
                  <td style="width: 21%;"><strong>${team.dept}</strong></td>
                  <th style="width: 12%;">직급</th>
                  <td style="width: 22%;"><strong>${team.role}</strong></td>
                </tr>
                <tr>
                  <th>처리기간</th>
                  <td><strong>2026.10.01 ~ 2026.10.12</strong></td>
                  <th>제출일자</th>
                  <td colspan="3"><strong>2026.10.24</strong></td>
                </tr>
              </tbody>
            </table>
          </header>

          <!-- Mission Statement Banner -->
          <div class="doc-mission-banner">
            <span class="mission-label">팀 핵심 목표:</span>
            <span class="mission-text">${team.mission}</span>
          </div>

          <!-- Section 1: 오류 현황 (목표: 월 3건) -->
          <section class="doc-section">
            <h3 class="tr-section-title">1. 오류 현황 (목표: 월 3건 이하 관리)</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 18%;">이름</th>
                  <th style="width: 15%;">오류건수</th>
                  <th style="width: 20%;">달성율 (%)</th>
                  <th style="width: 32%;">주요 오류 발생 유형</th>
                  <th style="width: 15%;">손실금액 (원)</th>
                </tr>
              </thead>
              <tbody>
                ${errorRowsHtml}
                <tr class="tr-total-row">
                  <td><strong>팀 합계 / 평균</strong></td>
                  <td class="text-center ${totalErrors > targetErrorsTotal ? 'text-danger' : 'text-success'}">
                    <strong>${totalErrors}건</strong>
                  </td>
                  <td class="text-center">
                    <strong>${totalErrors === 0 ? '100% (무결점)' : (totalErrors <= targetErrorsTotal ? '100% (달성)' : Math.round((targetErrorsTotal / totalErrors) * 100) + '%')}</strong>
                  </td>
                  <td class="text-left">팀원 ${team.members.length}명 관리 (목표 총 ${targetErrorsTotal}건 이하)</td>
                  <td class="text-danger"><strong>${totalCost.toLocaleString()}원</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 2: 해피콜 및 사후관리 -->
          <section class="doc-section">
            ${section2ContentHtml}
          </section>

          <!-- Section 3: 고객 주문 접수량 (목표: 일일 5건) -->
          <section class="doc-section">
            <h3 class="tr-section-title">
              3. 고객 주문 접수량 목표: 일일 5건
              ${team.id === 'teamChain' ? '<span class="title-sub-tag">(고객접수 vs 파란접수 분리 표기)</span>' : ''}
            </h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 18%;">이름</th>
                  <th style="width: 14%;">목표량</th>
                  ${team.id === 'teamChain' ? `
                    <th style="width: 13%;">고객접수</th>
                    <th style="width: 13%;">파란접수</th>
                  ` : ''}
                  <th style="width: 16%;">접수량 (완료)</th>
                  <th style="width: 16%;">달성율 (%)</th>
                  <th style="width: ${team.id === 'teamChain' ? '10%' : '23%'};">달성금액</th>
                </tr>
              </thead>
              <tbody>
                ${receptionRowsHtml}
                <tr class="tr-total-row">
                  <td><strong>팀 총계</strong></td>
                  <td class="text-center"><strong>${memberStats.length * 30}건</strong></td>
                  ${team.id === 'teamChain' ? `
                    <td class="text-center text-indigo"><strong>${totalCustomer}건</strong></td>
                    <td class="text-center text-sky"><strong>${totalParan}건</strong></td>
                  ` : ''}
                  <td class="text-center text-success"><strong>${totalCompleted}건</strong></td>
                  <td class="text-center text-success"><strong>${((totalCompleted / (memberStats.length * 30)) * 100).toFixed(1)}% (초과 달성)</strong></td>
                  <td class="text-right"><strong>${totalAmount > 0 ? totalAmount.toLocaleString() + '원' : '-'}</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 4: 팀장 종합 실무 평가 & 관리 지침 -->
          <section class="doc-section">
            <h3 class="tr-section-title">4. ${team.name} 팀장 종합 실무 평가 및 차기 관리 지침</h3>
            <div class="doc-leader-guideline-box">
              <ul class="doc-guideline-list">
                ${team.keyPractices.map(p => `<li>${p}</li>`).join('')}
              </ul>
            </div>
          </section>

          <!-- Document Footer Signature -->
          <footer class="doc-footer-signature">
            <div class="sign-block">
              <span class="sign-date">보고일자: 2026년 10월 24일</span>
              <span class="sign-name">보고자: ${team.dept} ${team.role} <strong>${team.leader}</strong> (인)</span>
            </div>
          </footer>

        </article>
      `;

      container.innerHTML = fullReportHtml;
    },

    /**
     * 모달 열기 함수 (외부 호출용)
     */
    async openModal(teamId = 'teamChain') {
      this.ensureModalCreated();
      const modal = document.getElementById('team-report-modal');
      if (!modal) return;

      this.currentTeamId = teamId;

      // 네비게이션 버튼 활성화
      const navBtns = modal.querySelectorAll('.tr-nav-btn');
      navBtns.forEach(btn => {
        if (btn.getAttribute('data-team') === teamId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // 렌더링
      await this.renderReport(teamId);

      // 모달 표시
      modal.classList.add('show');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    },

    /**
     * 피드백 페이지 내 인라인 렌더링 (탭 클릭 시)
     */
    async renderInline(containerId, initialTeamId = 'teamChain') {
      const container = document.getElementById(containerId);
      if (!container) return;

      this.currentTeamId = initialTeamId;

      const inlineHtml = `
        <div class="team-report-inline-wrapper" style="animation: fadeIn 0.3s ease;">
          
          <!-- Top Sub-Nav Bar with 4 Teams -->
          <div class="feedback-sub-filter-bar" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: rgba(30, 41, 59, 0.7); padding: 14px 20px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.1);">
            <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="tr-inline-tab-bar">
              <button type="button" class="btn btn-secondary tr-inline-tab-btn ${initialTeamId === 'team1' ? 'active' : ''}" data-team="team1" style="font-size: 13px; font-weight: 700; padding: 8px 16px;">
                🛡️ 1팀 보고서 (이재희 팀)
              </button>
              <button type="button" class="btn btn-secondary tr-inline-tab-btn ${initialTeamId === 'team2' ? 'active' : ''}" data-team="team2" style="font-size: 13px; font-weight: 700; padding: 8px 16px;">
                ⚡ 2팀 보고서 (박소영 팀)
              </button>
              <button type="button" class="btn btn-secondary tr-inline-tab-btn ${initialTeamId === 'team3' ? 'active' : ''}" data-team="team3" style="font-size: 13px; font-weight: 700; padding: 8px 16px;">
                👑 3팀 보고서 (손수령 팀)
              </button>
              <button type="button" class="btn btn-secondary tr-inline-tab-btn ${initialTeamId === 'teamChain' ? 'active' : ''}" data-team="teamChain" style="font-size: 13px; font-weight: 700; padding: 8px 16px; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border-color: #10b981;">
                🏢 체인팀 보고서 (김숙정 팀)
              </button>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <button type="button" class="btn btn-primary" id="tr-inline-btn-print" style="font-size: 12px; padding: 8px 16px; background: linear-gradient(135deg, #10b981, #059669); border: none; font-weight: 800; box-shadow: 0 0 16px rgba(16, 185, 129, 0.35); cursor: pointer;">
                🖨️ A4 용지 인쇄 / PDF 저장
              </button>
              <a href="./팀 보고서 양식/체인팀_주간보고서_분석결과.xlsx" download="체인팀_주간보고서_분석결과.xlsx" class="btn btn-secondary" id="tr-inline-excel-btn" style="font-size: 12px; padding: 8px 14px; text-decoration: none; color: #93c5fd; border-color: rgba(59, 130, 246, 0.4); display: ${initialTeamId === 'teamChain' ? 'inline-flex' : 'none'}; align-items: center; gap: 4px;">
                📥 엑셀 원본(.xlsx) 다운로드
              </a>
            </div>
          </div>

          <!-- Document Sheet Container -->
          <div class="team-report-sheet-container" style="border-radius: 12px; padding: 24px 16px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08);">
            <div class="team-report-sheet" id="team-report-sheet-inline">
              <!-- Report Content -->
            </div>
          </div>

        </div>
      `;

      container.innerHTML = inlineHtml;

      const inlineTabBar = document.getElementById('tr-inline-tab-bar');
      const inlinePrintBtn = document.getElementById('tr-inline-btn-print');
      const excelBtn = document.getElementById('tr-inline-excel-btn');

      const updateActiveTeam = async (tId) => {
        this.currentTeamId = tId;
        const btns = inlineTabBar.querySelectorAll('.tr-inline-tab-btn');
        btns.forEach(b => {
          if (b.getAttribute('data-team') === tId) {
            b.classList.add('active');
            b.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            b.style.color = '#ffffff';
            b.style.borderColor = '#10b981';
          } else {
            b.classList.remove('active');
            b.style.background = '';
            b.style.color = '';
            b.style.borderColor = '';
          }
        });

        if (excelBtn) {
          const fileMap = {
            team1: '1팀_주간보고서_분석결과.xlsx',
            team2: '2팀_주간보고서_분석결과.xlsx',
            team3: '3팀_주간보고서_분석결과.xlsx',
            teamChain: '체인팀_주간보고서_분석결과.xlsx'
          };
          const teamNameMap = { team1: '1팀', team2: '2팀', team3: '3팀', teamChain: '체인팀' };
          const fname = fileMap[tId] || '체인팀_주간보고서_분석결과.xlsx';
          excelBtn.href = `./팀 보고서 양식/${fname}`;
          excelBtn.download = fname;
          excelBtn.innerHTML = `📥 ${teamNameMap[tId] || ''} 엑셀(.xlsx) 다운로드`;
          excelBtn.style.display = 'inline-flex';
        }

        const reportContainer = document.getElementById('team-report-sheet-inline');
        if (reportContainer) {
          const origId = reportContainer.id;
          reportContainer.id = 'team-report-sheet';
          await this.renderReport(tId);
          reportContainer.id = origId;
        }
      };

      if (inlineTabBar) {
        inlineTabBar.addEventListener('click', (e) => {
          const btn = e.target.closest('.tr-inline-tab-btn');
          if (!btn) return;
          const tId = btn.getAttribute('data-team');
          updateActiveTeam(tId);
        });
      }

      if (inlinePrintBtn) {
        inlinePrintBtn.addEventListener('click', () => {
          window.print();
        });
      }

      await updateActiveTeam(initialTeamId);
    }
  };

  // 전역 등록
  window.TeamReportsModule = TeamReportsModule;

  // DOM 로드 시 버튼 바인딩
  document.addEventListener('DOMContentLoaded', () => {
    // 1. 메인 대시보드 및 피드백 페이지 공통 보고서 출력 버튼
    const triggerBtns = document.querySelectorAll('#btn-open-team-reports, #btn-open-team-reports-feedback');
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        TeamReportsModule.openModal('teamChain');
      });
    });

    // 2. 피드백 페이지 내의 [🖨️ 인쇄 / PDF 저장] 버튼을 누르면 바로 보고서 출력 모달을 띄워 인쇄할 수 있도록 연동
    const feedbackPrintBtn = document.getElementById('btn-print-report');
    if (feedbackPrintBtn) {
      feedbackPrintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        TeamReportsModule.openModal(TeamReportsModule.currentTeamId || 'teamChain');
      });
    }
  });

})();
