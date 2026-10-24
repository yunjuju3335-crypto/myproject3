/**
 * 팀별 주간 업무 목표 보고서 모듈 (teamReports.js)
 * - 1팀, 2팀, 3팀, 체인팀 각각의 실물 엑셀 양식 구조를 100% 그대로 반영하여 렌더링
 * - 1팀: 수신·접수 주간 점검표 + 유사 배송지 팀장 주간 관리 현황
 * - 2팀: 마감 확인 체크리스트 + 2팀 접수/수신 주간 피드백 보고서
 * - 3팀: 3팀 주간 리스크관리 실행결과 보고서 + 리스크 실행계획 & 중점관리
 * - 체인팀: 2026 체인팀 목표 주간 보고서 (오류 3건, 해피콜 TOP5, 고객접수 일일 5건 = 25건 목표)
 * - A4 규격 최적화 인쇄 / PDF 저장 지원
 * - 각 팀별 정식 엑셀 원본(.xlsx) 다운로드 연동
 */

(function () {
  'use strict';

  const TEAM_DEFINITIONS = [
    {
      id: 'team1',
      name: '1팀',
      leader: '이재희',
      role: '팀장',
      dept: '고객지원1팀',
      excelFile: '1팀_주간보고서_분석결과.xlsx',
      title: '2026 하반기 1팀 수신·접수 주간 점검 보고서',
      serial: 'RPT-202610-TEAM1'
    },
    {
      id: 'team2',
      name: '2팀',
      leader: '박소영',
      role: '대리 (팀장)',
      dept: '고객지원2팀',
      excelFile: '2팀_주간보고서_분석결과.xlsx',
      title: '2026 2팀 주간 마감체크 및 접수·수신 피드백 보고서',
      serial: 'RPT-202610-TEAM2'
    },
    {
      id: 'team3',
      name: '3팀',
      leader: '손수령',
      role: '팀장',
      dept: '고객지원3팀',
      excelFile: '3팀_주간보고서_분석결과.xlsx',
      title: '2026 3팀 주간 리스크관리 실행결과 보고서',
      serial: 'RPT-202610-TEAM3'
    },
    {
      id: 'teamChain',
      name: '체인팀',
      leader: '김숙정',
      role: '주임 (팀장)',
      dept: '체인중개팀',
      excelFile: '체인팀_주간보고서_분석결과.xlsx',
      title: '2026 체인팀 목표 주간 보고서',
      serial: 'RPT-202610-CHAIN'
    }
  ];

  const TeamReportsModule = {
    currentTeamId: 'teamChain',

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
                    회사 공식 주간보고서 실물 서식에 맞춰 분석된 <strong>1팀, 2팀, 3팀, 체인팀</strong> 보고서를 확인하고 A4로 즉시 인쇄·출력할 수 있습니다.
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
                ℹ️ <strong>인쇄 팁:</strong> 상단의 [🖨️ A4 용지 인쇄 / PDF 저장] 버튼을 누르면 브라우저 인쇄 창이 열리며, 선택된 팀 보고서 본문만 A4 규격에 맞추어 깔끔하게 인쇄되거나 PDF로 저장됩니다.
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
     * 데이터 번들 수집
     */
    async resolveData() {
      if (window.appFeedbackState && window.appFeedbackState.dataBundle) {
        return window.appFeedbackState.dataBundle;
      }

      const store = window.appStore;
      let prevRows = store ? store.data.prevOrders : [];
      let currRows = store ? store.data.currOrders : [];
      let prodRows = store ? store.data.products : [];
      let recRows = store ? store.data.receptions : [];
      let errRows = store ? store.data.errors : [];
      let perfRows = store ? store.data.performances : [];

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

      if ((!recRows || recRows.length === 0) && window.SAMPLE_DATA_BUNDLE) {
        recRows = window.SAMPLE_DATA_BUNDLE.receptions || [];
        errRows = window.SAMPLE_DATA_BUNDLE.errors || [];
        prevRows = window.SAMPLE_DATA_BUNDLE.prevOrders || [];
        currRows = window.SAMPLE_DATA_BUNDLE.currOrders || [];
        prodRows = window.SAMPLE_DATA_BUNDLE.products || [];
        perfRows = window.SAMPLE_DATA_BUNDLE.performances || [];
      }

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

      return { recRows, errRows, prevRows, currRows, prodRows, staffOutput, hgsOutput, rankingOutput };
    },

    /**
     * 1팀 보고서 렌더링 (1팀 주간보고서_양식.xlsx 실물 반영)
     */
    renderTeam1Html() {
      return `
        <article class="a4-document-paper">
          <header class="doc-header">
            <div class="doc-title-wrapper">
              <h1 class="doc-main-title">2026 하반기 수신·접수 주간 점검 보고서 (1팀)</h1>
              <span class="doc-serial-no">문서번호: RPT-202610-TEAM1</span>
            </div>

            <table class="tr-meta-table">
              <tbody>
                <tr>
                  <th style="width: 12%;">작성자</th>
                  <td style="width: 21%;"><strong>이재희</strong></td>
                  <th style="width: 12%;">부서</th>
                  <td style="width: 21%;"><strong>고객지원1팀</strong></td>
                  <th style="width: 12%;">직급</th>
                  <td style="width: 22%;"><strong>팀장</strong></td>
                </tr>
                <tr>
                  <th>점검기간</th>
                  <td><strong>2026.10 1주차 ~ 2주차</strong></td>
                  <th>제출일자</th>
                  <td colspan="3"><strong>2026.10.24</strong></td>
                </tr>
              </tbody>
            </table>
          </header>

          <div class="doc-mission-banner">
            <span class="mission-label">1팀 업무 지침:</span>
            <span class="mission-text">※ 전 항목 자동 집계 구간 — 각 팀원 시트의 수신·접수 입력값을 참조하여 엄격한 품질 점검을 실시합니다.</span>
          </div>

          <!-- Section 1: 주간 수신·접수 점검표 -->
          <section class="doc-section">
            <h3 class="tr-section-title">1. 주간 수신·접수 목표 및 실적 점검표 (개인별 집계)</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 10%;">직원</th>
                  <th style="width: 11%;">근무연차</th>
                  <th style="width: 9%;">수신목표</th>
                  <th style="width: 9%;">수신실적</th>
                  <th style="width: 11%;">수신달성률</th>
                  <th style="width: 9%;">수신달성</th>
                  <th style="width: 9%;">접수목표</th>
                  <th style="width: 9%;">접수실적</th>
                  <th style="width: 11%;">접수달성률</th>
                  <th style="width: 12%;">접수달성</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>이재희</strong> <span class="tr-role-tag leader">팀장</span></td>
                  <td class="text-center">1년 이상</td>
                  <td class="text-center">50건</td>
                  <td class="text-center">41.8건</td>
                  <td class="text-center text-danger">83.6%</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달</span></td>
                  <td class="text-center"><strong>65건</strong></td>
                  <td class="text-center"><strong>43.0건</strong></td>
                  <td class="text-center text-danger">66.2%</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달</span></td>
                </tr>
                <tr>
                  <td><strong>김가은</strong></td>
                  <td class="text-center">1년 이상</td>
                  <td class="text-center">50건</td>
                  <td class="text-center">38.5건</td>
                  <td class="text-center text-danger">77.0%</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달</span></td>
                  <td class="text-center"><strong>65건</strong></td>
                  <td class="text-center"><strong>48.8건</strong></td>
                  <td class="text-center text-danger">75.0%</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달</span></td>
                </tr>
                <tr>
                  <td><strong>김보혜</strong></td>
                  <td class="text-center">1년 이상</td>
                  <td class="text-center">50건</td>
                  <td class="text-center text-success"><strong>57.3건</strong></td>
                  <td class="text-center text-success"><strong>114.7%</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-center"><strong>65건</strong></td>
                  <td class="text-center"><strong>54.6건</strong></td>
                  <td class="text-center text-danger">84.0%</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달</span></td>
                </tr>
                <tr>
                  <td><strong>박언정</strong></td>
                  <td class="text-center">1년 미만</td>
                  <td class="text-center">45건</td>
                  <td class="text-center text-success"><strong>47.3건</strong></td>
                  <td class="text-center text-success"><strong>105.2%</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-center"><strong>60건</strong></td>
                  <td class="text-center text-success"><strong>63.6건</strong></td>
                  <td class="text-center text-success"><strong>106.0%</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 🎯</span></td>
                </tr>
                <tr>
                  <td><strong>강아름</strong></td>
                  <td class="text-center">1년 미만</td>
                  <td class="text-center">45건</td>
                  <td class="text-center">26.8건</td>
                  <td class="text-center text-danger">59.6%</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달</span></td>
                  <td class="text-center"><strong>60건</strong></td>
                  <td class="text-center text-success"><strong>70.4건</strong></td>
                  <td class="text-center text-success"><strong>117.3%</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">최다 🎯</span></td>
                </tr>
                <tr class="tr-total-row">
                  <td><strong>팀 평균 / 합계</strong></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><strong>240건</strong></td>
                  <td class="text-center"><strong>211.7건</strong></td>
                  <td class="text-center"><strong>88.2%</strong></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><strong>315건</strong></td>
                  <td class="text-center text-success"><strong>280.4건</strong></td>
                  <td class="text-center text-success"><strong>89.0%</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">양호</span></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 2: 유사 배송지 팀장 주간 관리 현황 -->
          <section class="doc-section">
            <h3 class="tr-section-title">2. 유사 배송지 팀장 주간 관리 현황 (오류 예방 및 집중 관리)</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 8%;">주차</th>
                  <th style="width: 8%;">점검인원</th>
                  <th style="width: 8%;">완료</th>
                  <th style="width: 9%;">오류건</th>
                  <th style="width: 9%;">신규등록</th>
                  <th style="width: 28%;">오류 내용 (실제 발생 배송지)</th>
                  <th style="width: 30%;">피드백 및 개선 조치 사항</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-center"><strong>1주차</strong></td>
                  <td class="text-center">3명</td>
                  <td class="text-center">3명</td>
                  <td class="text-center text-danger"><strong>1건</strong></td>
                  <td class="text-center text-success">1건</td>
                  <td class="text-left text-danger"><strong>안산 온누리 -> 인천 온누리로 접수</strong></td>
                  <td class="text-left">안산 온누리 관련 배송지 오류 확인 후 유사 배송지 주의 리스트에 신규 등록하고 팀원 공유함. 상세주소까지 재확인 안내.</td>
                </tr>
                <tr>
                  <td class="text-center"><strong>2주차</strong></td>
                  <td class="text-center">3명</td>
                  <td class="text-center">3명</td>
                  <td class="text-center text-danger"><strong>2건</strong></td>
                  <td class="text-center text-success">2건</td>
                  <td class="text-left text-danger">
                    <strong>1) 동국대학교 경주 -> 일산으로 접수<br>2) 전북대학교 병원 -> 경북대병원 접수</strong>
                  </td>
                  <td class="text-left">배송지 오류 2건 내용 확인 후 주의 리스트 신규 등록. 접수 시 병원명 및 지역명까지 정확히 확인하도록 안내하고 재발 방지 점검.</td>
                </tr>
                <tr>
                  <td class="text-center"><strong>3주차</strong></td>
                  <td class="text-center">4명</td>
                  <td class="text-center">4명</td>
                  <td class="text-center text-success"><strong>0건</strong></td>
                  <td class="text-center">0건</td>
                  <td class="text-center text-muted">특이 오류 없음 (무결점 유지)</td>
                  <td class="text-left">3주차는 유사배송지 관련 오류 없이 점검 완료. 신규 오류 발생 시 즉시 리스트에 반영 및 팀원 공유 체계 가동.</td>
                </tr>
                <tr>
                  <td class="text-center"><strong>4~5주차</strong></td>
                  <td class="text-center">4명</td>
                  <td class="text-center">4명</td>
                  <td class="text-center text-success"><strong>0건</strong></td>
                  <td class="text-center">0건</td>
                  <td class="text-center text-muted">특이 오류 없음 (무결점 유지)</td>
                  <td class="text-left">유사배송지 점검 결과 오류 및 신규 등록 건 없이 안정적 관리 완료. 지속적인 점검을 통해 무오류 유지.</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 3: 1팀 팀장 주간 총평 및 관리방침 -->
          <section class="doc-section">
            <h3 class="tr-section-title">3. 1팀 주간 총평 및 차기 관리방침</h3>
            <div class="doc-leader-guideline-box">
              <ul class="doc-guideline-list">
                <li><strong>[접수 실적 우수]</strong> 강아름(70.4건), 박언정(63.6건) 사원이 주간 접수 목표를 대폭 초과 달성하며 팀 실적 견인.</li>
                <li><strong>[수신 실적 보완]</strong> 이재희 팀장 및 강아름 사원의 수신율이 다소 미달하였으므로, 통화 피크 시간대(09~11시) 수신 응대 비중을 우선 조정.</li>
                <li><strong>[유사 배송지 2중 검수]</strong> 온누리 및 대학교 병원 등 유사 명칭 배송지에 대해 도로명 주소 팝업 확인을 거쳐 오배송 원천 차단.</li>
              </ul>
            </div>
          </section>

          <footer class="doc-footer-signature">
            <div class="sign-block">
              <span class="sign-date">보고일자: 2026년 10월 24일</span>
              <span class="sign-name">보고자: 고객지원1팀 팀장 <strong>이재희</strong> (인)</span>
            </div>
          </footer>
        </article>
      `;
    },

    /**
     * 2팀 보고서 렌더링 (2팀 주간보고서_양식.xlsx 실물 반영)
     */
    renderTeam2Html() {
      return `
        <article class="a4-document-paper">
          <header class="doc-header">
            <div class="doc-title-wrapper">
              <h1 class="doc-main-title">2026 2팀 주간 마감체크 및 접수·수신 피드백 보고서</h1>
              <span class="doc-serial-no">문서번호: RPT-202610-TEAM2</span>
            </div>

            <table class="tr-meta-table">
              <tbody>
                <tr>
                  <th style="width: 12%;">작성자</th>
                  <td style="width: 21%;"><strong>박소영</strong></td>
                  <th style="width: 12%;">부서</th>
                  <td style="width: 21%;"><strong>고객지원2팀</strong></td>
                  <th style="width: 12%;">직급</th>
                  <td style="width: 22%;"><strong>대리 (팀장)</strong></td>
                </tr>
                <tr>
                  <th>점검기간</th>
                  <td><strong>2026.09.28 ~ 2026.10.04</strong></td>
                  <th>제출일자</th>
                  <td colspan="3"><strong>2026.10.24</strong></td>
                </tr>
              </tbody>
            </table>
          </header>

          <div class="doc-mission-banner">
            <span class="mission-label">2팀 목표 기준:</span>
            <span class="mission-text"><strong>하루 목표: 접수 60개 / 수신 35개</strong> (휴무일수 제외: 주 6일=접수 360/수신 210, 주 5일=접수 300/수신 175, 주 4일=접수 240/수신 140)</span>
          </div>

          <!-- Section 1: 주간 접수 / 수신 실적 및 피드백 -->
          <section class="doc-section">
            <h3 class="tr-section-title">1. 주간 업무 접수/수신 실적 및 달성 현황</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 11%;">이름</th>
                  <th style="width: 10%;">근무일수</th>
                  <th style="width: 9%;">접수목표</th>
                  <th style="width: 9%;">접수실적</th>
                  <th style="width: 9%;">접수달성</th>
                  <th style="width: 9%;">수신목표</th>
                  <th style="width: 9%;">수신실적</th>
                  <th style="width: 9%;">수신달성</th>
                  <th style="width: 25%;">팀장 개별 피드백 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>최승애</strong></td>
                  <td class="text-center">주 6일 (휴무1일)</td>
                  <td class="text-center">360개</td>
                  <td class="text-center text-success"><strong>393개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-center">210개</td>
                  <td class="text-center text-success"><strong>226개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-left">접수와 수신 모두 목표를 달성하였으며 전반적인 흐름도 양호합니다. 성수기 실적 증대 지속 관리.</td>
                </tr>
                <tr>
                  <td><strong>손수진</strong></td>
                  <td class="text-center">주 6일 (휴무1일)</td>
                  <td class="text-center">360개</td>
                  <td class="text-center text-success"><strong>368개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-center">210개</td>
                  <td class="text-center text-success"><strong>373개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">최다 👑</span></td>
                  <td class="text-left">접수와 수신 모두 압도적 목표를 달성하였고 오류 없이 안정적으로 처리됨. 모범 품질 유지.</td>
                </tr>
                <tr>
                  <td><strong>손미경</strong></td>
                  <td class="text-center">주 5일 (휴무2일)</td>
                  <td class="text-center">300개</td>
                  <td class="text-center text-success"><strong>338개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-center">175개</td>
                  <td class="text-center text-danger">151개</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달성</span></td>
                  <td class="text-left">이번 주 접수 목표는 달성하였으나 수신은 여전히 미달 상태입니다. 성수기 수신/접수 함께 관리 필요.</td>
                </tr>
                <tr>
                  <td><strong>박재현</strong></td>
                  <td class="text-center">주 5일 (휴무2일)</td>
                  <td class="text-center">300개</td>
                  <td class="text-center text-danger">263개</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달성</span></td>
                  <td class="text-center">175개</td>
                  <td class="text-center text-danger">96개</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달성</span></td>
                  <td class="text-left">접수와 수신 양이 전반적으로 저조하며 특히 수신 보강 시급. 전화 응대 우선순위 조정 필요.</td>
                </tr>
                <tr>
                  <td><strong>주가영</strong></td>
                  <td class="text-center">주 4일 (휴무3일)</td>
                  <td class="text-center">240개</td>
                  <td class="text-center text-success"><strong>247개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-center">140개</td>
                  <td class="text-center text-success"><strong>181개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">달성 👑</span></td>
                  <td class="text-left">영수증 관련 업무는 전반적으로 안정된 모습이며 접수와 수신 목표를 달성함.</td>
                </tr>
                <tr>
                  <td><strong>박소영</strong> <span class="tr-role-tag leader">팀장</span></td>
                  <td class="text-center">주 6일 (휴무1일)</td>
                  <td class="text-center">360개</td>
                  <td class="text-center text-danger">237개</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달성</span></td>
                  <td class="text-center">210개</td>
                  <td class="text-center text-danger">95개</td>
                  <td class="text-center"><span class="tr-badge badge-warning">미달성</span></td>
                  <td class="text-left">팀 총괄 마감 관리, 영수증 검수 및 직원별 수신·접수 조정 업무 전담.</td>
                </tr>
                <tr class="tr-total-row">
                  <td><strong>팀 총계</strong></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><strong>1,920개</strong></td>
                  <td class="text-center text-success"><strong>1,846개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">96.1%</span></td>
                  <td class="text-center"><strong>1,120개</strong></td>
                  <td class="text-center text-success"><strong>1,122개</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">100.2%</span></td>
                  <td class="text-left"><strong>팀 전체 수신 목표 100% 초과 달성 및 접수 96% 견인</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 2: 팀장 실행 계획 (Sheet1 원본) -->
          <section class="doc-section">
            <h3 class="tr-section-title">2. 2팀 팀장 실행 계획 및 중점 관리 사항 (Sheet1)</h3>
            <div class="doc-leader-guideline-box">
              <ul class="doc-guideline-list">
                <li><strong>① [매일 업무 조정]</strong> 매일 팀원 개인 수신·접수를 실시간 체크하여 업무 불균형 즉시 조정하기.</li>
                <li><strong>② [다빈도 오류 집중 체크]</strong> 
                  <br>- 주가영, 최승애, 손미경: <strong>영수증 미발행 / 영수증 이중발행</strong> 집중 점검
                  <br>- 손미경: <strong>부산 오브제 발주가</strong> 오입력 방지 유선 재확인
                </li>
                <li><strong>③ [유사 배송지 공유]</strong> 배송지 오류 줄이기 위해 유사 배송지 주의 리스트 매일 아침 공유.</li>
                <li><strong>④ [일주일 단위 체크 보고]</strong> 일주일 단위로 체크 보고 진행 (권차장님 최종 확인).</li>
              </ul>
            </div>
          </section>

          <footer class="doc-footer-signature">
            <div class="sign-block">
              <span class="sign-date">보고일자: 2026년 10월 24일</span>
              <span class="sign-name">보고자: 고객지원2팀 대리 <strong>박소영</strong> (인)</span>
            </div>
          </footer>
        </article>
      `;
    },

    /**
     * 3팀 보고서 렌더링 (3팀 주간보고서_양식.xlsx 실물 반영)
     */
    renderTeam3Html() {
      return `
        <article class="a4-document-paper">
          <header class="doc-header">
            <div class="doc-title-wrapper">
              <h1 class="doc-main-title">2026 3팀 주간 리스크관리 실행결과 보고서</h1>
              <span class="doc-serial-no">문서번호: RPT-202610-TEAM3</span>
            </div>

            <table class="tr-meta-table">
              <tbody>
                <tr>
                  <th style="width: 12%;">작성자</th>
                  <td style="width: 21%;"><strong>손수령</strong></td>
                  <th style="width: 12%;">부서</th>
                  <td style="width: 21%;"><strong>고객지원3팀</strong></td>
                  <th style="width: 12%;">직급</th>
                  <td style="width: 22%;"><strong>팀장</strong></td>
                </tr>
                <tr>
                  <th>보고기간</th>
                  <td><strong>2026.09.28 ~ 2026.10.04</strong></td>
                  <th>제출일자</th>
                  <td colspan="3"><strong>2026.10.24</strong></td>
                </tr>
              </tbody>
            </table>
          </header>

          <div class="doc-mission-banner">
            <span class="mission-label">3팀 관리 방침:</span>
            <span class="mission-text">접수오류 및 업무누락 제로화, 목표 대비 주간 접수량 달성률 철저 관리 (손수령 팀장 총괄)</span>
          </div>

          <!-- Section 1: 주간 핵심 관리현황 (Sheet1 원본) -->
          <section class="doc-section">
            <h3 class="tr-section-title">1. 주간 핵심 관리현황 (실행결과 대조)</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 18%;">중요 관리항목</th>
                  <th style="width: 22%;">금주 실행내용</th>
                  <th style="width: 20%;">금주 결과</th>
                  <th style="width: 20%;">문제점 / 위험요인</th>
                  <th style="width: 20%;">다음 주 실행계획</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>접수오류 관리</strong></td>
                  <td class="text-left">직원별 오류 발생건 확인 및 반복오류 점검</td>
                  <td class="text-center text-success"><strong>총 1건 (전주 4건 대비 ▼3건)</strong></td>
                  <td class="text-left text-danger">기타오류: 상품금액 조정고객 미조정</td>
                  <td class="text-left">반복오류 직원 개별 피드백 및 해당 오류 집중 점검</td>
                </tr>
                <tr>
                  <td><strong>동일유형 오류 관리</strong></td>
                  <td class="text-left">동일 오류 발생 여부 및 원인 확인</td>
                  <td class="text-center text-success"><strong>동일유형 오류 0건</strong></td>
                  <td class="text-left text-muted">오류 없음 (정상)</td>
                  <td class="text-left">해당 업무 재교육 및 다음 주 재발 여부 확인</td>
                </tr>
                <tr>
                  <td><strong>접수량 관리</strong></td>
                  <td class="text-left">직원별 목표 대비 주간 접수량 및 달성률 확인</td>
                  <td class="text-center"><strong>정상 4명 / 관리 1명</strong></td>
                  <td class="text-left text-danger">목표 80% 미만 1명 (손수령)</td>
                  <td class="text-left">미달자 원인 파악 후 접수기회 및 업무배분 조정</td>
                </tr>
                <tr>
                  <td><strong>접수·배송 누락 관리</strong></td>
                  <td class="text-left">당일 접수건과 발주건 대조 및 마감 확인</td>
                  <td class="text-center text-success"><strong>접수누락 0건 / 배송누락 0건</strong></td>
                  <td class="text-left text-muted">누락 없음 (클린)</td>
                  <td class="text-left">동일 사례 재발방지 체크 및 팀 전체 공유</td>
                </tr>
                <tr>
                  <td><strong>배송일시·리본글 관리</strong></td>
                  <td class="text-left">발주 전 배송일시 및 리본문구 재확인</td>
                  <td class="text-center text-success"><strong>배송일시 0건 / 리본글 0건</strong></td>
                  <td class="text-left text-muted">오류 없음 (클린)</td>
                  <td class="text-left">해당 항목 발주 전 이중확인 지속</td>
                </tr>
                <tr>
                  <td><strong>주간 종합평가</strong></td>
                  <td class="text-left">전주 대비 위험요인 및 개선여부 확인</td>
                  <td class="text-center text-success"><strong>양호</strong></td>
                  <td class="text-left">핵심 위험요인 : 접수오류</td>
                  <td class="text-left">다음 주 중점관리 : 상품금액 확인 철저</td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 2: 금주 주요 결과 지표 (전주 vs 금주) -->
          <section class="doc-section">
            <h3 class="tr-section-title">2. 금주 주요 결과 비교 (리스크 감축 지표)</h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 25%;">구분</th>
                  <th style="width: 15%;">전주</th>
                  <th style="width: 15%;">금주</th>
                  <th style="width: 20%;">증감</th>
                  <th style="width: 25%;">평가</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>총 접수오류</strong></td>
                  <td class="text-center">4건</td>
                  <td class="text-center text-success"><strong>1건</strong></td>
                  <td class="text-center text-success"><strong>▼ 3건</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">정상</span></td>
                </tr>
                <tr>
                  <td><strong>동일유형 반복오류</strong></td>
                  <td class="text-center">1건</td>
                  <td class="text-center text-success"><strong>0건</strong></td>
                  <td class="text-center text-success"><strong>▼ 1건</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">정상</span></td>
                </tr>
                <tr>
                  <td><strong>접수누락 / 배송누락</strong></td>
                  <td class="text-center">1건</td>
                  <td class="text-center text-success"><strong>0건</strong></td>
                  <td class="text-center text-success"><strong>▼ 1건</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">목표 0건 달성</span></td>
                </tr>
                <tr>
                  <td><strong>접수량 90% 이상 직원</strong></td>
                  <td class="text-center">2명</td>
                  <td class="text-center text-success"><strong>4명</strong></td>
                  <td class="text-center text-success"><strong>▲ 2명</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">정상</span></td>
                </tr>
                <tr>
                  <td><strong>접수량 80% 미만 직원</strong></td>
                  <td class="text-center">3명</td>
                  <td class="text-center text-success"><strong>1명</strong></td>
                  <td class="text-center text-success"><strong>▼ 2명</strong></td>
                  <td class="text-center"><span class="tr-badge badge-success">대폭 개선</span></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 3: 금주 중점관리 대상 및 팀장 의견 -->
          <section class="doc-section">
            <h3 class="tr-section-title">3. 금주 중점관리 대상 & 팀장 종합의견 (Sheet1 원본)</h3>
            <table class="tr-table" style="margin-bottom: 14px;">
              <thead>
                <tr>
                  <th style="width: 15%;">대상이름</th>
                  <th style="width: 20%;">관리사유</th>
                  <th style="width: 25%;">금주 조치</th>
                  <th style="width: 20%;">결과</th>
                  <th style="width: 20%;">다음 주 관리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>손수령</strong></td>
                  <td class="text-center">접수량 목표 미달</td>
                  <td class="text-left">접수기회 및 업무배분 조정</td>
                  <td class="text-left">"접수량 조금 더 챙겨보겠습니다"</td>
                  <td class="text-left">접수량 추이 지속 확인 및 목표량 관리</td>
                </tr>
              </tbody>
            </table>

            <div class="doc-leader-guideline-box">
              <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1e293b;">[6. 팀장 종합의견 — 원문]</h4>
              <p style="margin: 0 0 6px 0; font-size: 12px; line-height: 1.6; color: #334155;">
                금주에는 배송일시오류 방지와 접수량 증가를 중점적으로 관리하였다. 전주 대비 총 접수량과 접수오류는 개선되었으며, 반면 상품금액 조정고객 확인 부분은 추가 관리가 필요한 것으로 확인되었다.
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #334155;">
                다음 주에는 상품조정고객 마감 시 잘 확인하는 걸 우선 관리항목으로 선정하여 반복오류 및 업무누락을 예방하고, 목표 미달 직원에 대해서는 원인별 관리 및 재점검을 실시할 예정이다.
              </p>
            </div>
          </section>

          <footer class="doc-footer-signature">
            <div class="sign-block">
              <span class="sign-date">보고일자: 2026년 10월 24일</span>
              <span class="sign-name">보고자: 고객지원3팀 팀장 <strong>손수령</strong> (인)</span>
            </div>
          </footer>
        </article>
      `;
    },

    /**
     * 체인팀 보고서 렌더링 (체인팀_주간보고서_양식.xls 실물 반영)
     */
    renderChainTeamHtml(bundle) {
      return `
        <article class="a4-document-paper">
          <header class="doc-header">
            <div class="doc-title-wrapper">
              <h1 class="doc-main-title">2026 체인팀 목표 주간 보고서</h1>
              <span class="doc-serial-no">문서번호: RPT-202610-CHAIN</span>
            </div>

            <table class="tr-meta-table">
              <tbody>
                <tr>
                  <th style="width: 12%;">작성자</th>
                  <td style="width: 21%;"><strong>김숙정</strong></td>
                  <th style="width: 12%;">부서</th>
                  <td style="width: 21%;"><strong>체인중개팀</strong></td>
                  <th style="width: 12%;">직급</th>
                  <td style="width: 22%;"><strong>주임</strong></td>
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

          <div class="doc-mission-banner">
            <span class="mission-label">체인팀 핵심 목표:</span>
            <span class="mission-text">화원사 체인 발주 순증가 견인 및 고객 주문 접수량 일일 5건 달성, 무결점 신뢰 구축</span>
          </div>

          <!-- Section 1: 오류 현황 (목표: 월 3건 이하) -->
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
                <tr>
                  <td class="tr-col-name"><strong>김숙정</strong> <span class="tr-role-tag leader">팀장</span></td>
                  <td class="tr-col-err-cnt text-danger"><strong>5건</strong></td>
                  <td class="tr-col-rate text-danger">60.0% (초과 2건)</td>
                  <td class="tr-col-err-type">수신인 연락처 오기 (3건), 동·호수 누락 (2건)</td>
                  <td class="tr-col-cost text-danger">125,000원</td>
                </tr>
                <tr>
                  <td class="tr-col-name"><strong>유혜미</strong></td>
                  <td class="tr-col-err-cnt text-success"><strong>0건</strong></td>
                  <td class="tr-col-rate text-success"><strong>100% (무오류 👑)</strong></td>
                  <td class="tr-col-err-type">오류 없음 (전사 무결점 표준 모델)</td>
                  <td class="tr-col-cost text-success">0원</td>
                </tr>
                <tr>
                  <td class="tr-col-name"><strong>김경미</strong></td>
                  <td class="tr-col-err-cnt text-danger"><strong>5건</strong></td>
                  <td class="tr-col-rate text-danger">60.0% (초과 2건)</td>
                  <td class="tr-col-err-type">상품 옵션 누락 (2건), 배송시간 미기재 (3건)</td>
                  <td class="tr-col-cost text-danger">85,000원</td>
                </tr>
                <tr class="tr-total-row">
                  <td><strong>팀 합계 / 평균</strong></td>
                  <td class="text-center text-danger"><strong>10건</strong></td>
                  <td class="text-center"><strong>73.3%</strong></td>
                  <td class="text-left">3명 관리 (목표 총 9건 이하 / 초과 1건)</td>
                  <td class="text-danger"><strong>210,000원</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 2: 해피콜 사후 관리 TOP 5 -->
          <section class="doc-section">
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

              <h4 class="tr-sub-section-title" style="margin-top: 18px;">2-2. 발주 많은 지점 해피콜 현황보고</h4>
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
          </section>

          <!-- Section 3: 고객 주문 접수량 목표: 일일 5건 (정확한 목표량 & 접수량 수치 반영) -->
          <section class="doc-section">
            <h3 class="tr-section-title">
              3. 고객 주문 접수량 목표: 일일 5건
              <span class="title-sub-tag">(주간 5영업일 = 목표 25건 | 고객접수 vs 파란접수 분리 표기)</span>
            </h3>
            <table class="tr-table">
              <thead>
                <tr>
                  <th style="width: 18%;">이름</th>
                  <th style="width: 14%;">목표량 (주간)</th>
                  <th style="width: 14%;">고객접수</th>
                  <th style="width: 14%;">파란접수</th>
                  <th style="width: 14%;">총 접수량</th>
                  <th style="width: 14%;">달성율 (%)</th>
                  <th style="width: 12%;">달성금액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="tr-col-name"><strong>김숙정</strong> <span class="tr-role-tag leader">팀장</span></td>
                  <td class="tr-col-target"><strong>25건</strong></td>
                  <td class="tr-col-cust text-indigo"><strong>16건</strong></td>
                  <td class="tr-col-paran text-sky"><strong>16건</strong></td>
                  <td class="tr-col-achieve text-success"><strong>32건</strong></td>
                  <td class="tr-col-rate-badge">
                    <span class="tr-badge badge-success"><strong>128.0% 🎯 초과달성</strong></span>
                  </td>
                  <td class="tr-col-amount">1,440,000원</td>
                </tr>
                <tr>
                  <td class="tr-col-name"><strong>유혜미</strong></td>
                  <td class="tr-col-target"><strong>25건</strong></td>
                  <td class="tr-col-cust text-indigo"><strong>13건</strong></td>
                  <td class="tr-col-paran text-sky"><strong>13건</strong></td>
                  <td class="tr-col-achieve text-success"><strong>26건</strong></td>
                  <td class="tr-col-rate-badge">
                    <span class="tr-badge badge-success"><strong>104.0% 🎯 초과달성</strong></span>
                  </td>
                  <td class="tr-col-amount">1,170,000원</td>
                </tr>
                <tr>
                  <td class="tr-col-name"><strong>김경미</strong></td>
                  <td class="tr-col-target"><strong>25건</strong></td>
                  <td class="tr-col-cust text-indigo"><strong>14건</strong></td>
                  <td class="tr-col-paran text-sky"><strong>14건</strong></td>
                  <td class="tr-col-achieve text-success"><strong>28건</strong></td>
                  <td class="tr-col-rate-badge">
                    <span class="tr-badge badge-success"><strong>112.0% 🎯 초과달성</strong></span>
                  </td>
                  <td class="tr-col-amount">1,260,000원</td>
                </tr>
                <tr class="tr-total-row">
                  <td><strong>팀 총계</strong></td>
                  <td class="text-center"><strong>75건</strong></td>
                  <td class="text-center text-indigo"><strong>43건</strong></td>
                  <td class="text-center text-sky"><strong>43건</strong></td>
                  <td class="text-center text-success"><strong>86건</strong></td>
                  <td class="text-center text-success"><strong>114.7% (전원 초과 달성 🎯)</strong></td>
                  <td class="text-right"><strong>3,870,000원</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          <!-- Section 4: 차기 주간 목표 및 중점 관리 사항 -->
          <section class="doc-section">
            <h3 class="tr-section-title">4. 체인팀 차기 주간 목표 및 종합 실무 지침</h3>
            <div class="doc-leader-guideline-box">
              <ul class="doc-guideline-list">
                <li><strong>[접수 목표 전원 달성]</strong> 주간 25건(일일 5건) 목표를 김숙정(32건), 김경미(28건), 유혜미(26건) 전원이 100% 이상 초과 달성함.</li>
                <li><strong>[오류 감축 집중 관리]</strong> 김숙정, 김경미 사원의 오류(각 5건) 재발 방지를 위해 무오류 100%를 달성한 유혜미 사원의 템플릿 검수 프로세스를 공유.</li>
                <li><strong>[H·G 화원사 수급 확약]</strong> 대전중4호(+58건), 포항북1호(+72건) 등 주문 급증 지점에 대해 배송시간 사전 유선 확약제 실시.</li>
              </ul>
            </div>
          </section>

          <footer class="doc-footer-signature">
            <div class="sign-block">
              <span class="sign-date">보고일자: 2026년 10월 24일</span>
              <span class="sign-name">보고자: 체인중개팀 주임 <strong>김숙정</strong> (인)</span>
            </div>
          </footer>
        </article>
      `;
    },

    /**
     * 특정 팀 보고서 렌더링
     */
    async renderReport(teamId) {
      const container = document.getElementById('team-report-sheet');
      if (!container) return;

      const team = TEAM_DEFINITIONS.find(t => t.id === teamId) || TEAM_DEFINITIONS[3];
      const bundle = await this.resolveData();

      // 엑셀 다운로드 버튼 동적 링크 매핑
      const downloadLink = document.getElementById('tr-btn-download-excel-link');
      if (downloadLink) {
        const fname = team.excelFile || '체인팀_주간보고서_분석결과.xlsx';
        downloadLink.href = `./팀 보고서 양식/${fname}`;
        downloadLink.download = fname;
        downloadLink.innerHTML = `📥 ${team.name} 엑셀(.xlsx) 다운로드`;
        downloadLink.style.display = 'inline-flex';
      }

      // 팀별 실물 엑셀 서식에 맞춘 전용 렌더링 분기
      if (teamId === 'team1') {
        container.innerHTML = this.renderTeam1Html();
      } else if (teamId === 'team2') {
        container.innerHTML = this.renderTeam2Html();
      } else if (teamId === 'team3') {
        container.innerHTML = this.renderTeam3Html();
      } else {
        container.innerHTML = this.renderChainTeamHtml(bundle);
      }
    },

    /**
     * 모달 열기 함수 (외부 호출용)
     */
    async openModal(teamId = 'teamChain') {
      this.ensureModalCreated();
      const modal = document.getElementById('team-report-modal');
      if (!modal) return;

      this.currentTeamId = teamId;

      const navBtns = modal.querySelectorAll('.tr-nav-btn');
      navBtns.forEach(btn => {
        if (btn.getAttribute('data-team') === teamId) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      await this.renderReport(teamId);

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
              <a href="./팀 보고서 양식/체인팀_주간보고서_분석결과.xlsx" download="체인팀_주간보고서_분석결과.xlsx" class="btn btn-secondary" id="tr-inline-excel-btn" style="font-size: 12px; padding: 8px 14px; text-decoration: none; color: #93c5fd; border-color: rgba(59, 130, 246, 0.4); display: inline-flex; align-items: center; gap: 4px;">
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
    const triggerBtns = document.querySelectorAll('#btn-open-team-reports, #btn-open-team-reports-feedback');
    triggerBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        TeamReportsModule.openModal('teamChain');
      });
    });

    const feedbackPrintBtn = document.getElementById('btn-print-report');
    if (feedbackPrintBtn) {
      feedbackPrintBtn.addEventListener('click', (e) => {
        e.preventDefault();
        TeamReportsModule.openModal(TeamReportsModule.currentTeamId || 'teamChain');
      });
    }
  });

})();
