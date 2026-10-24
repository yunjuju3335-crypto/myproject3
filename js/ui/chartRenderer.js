/**
 * 차트 시각화 렌더러 (chartRenderer.js)
 * Chart.js 기반 인터랙티브 바 차트 및 트렌드 시각화
 */
class ChartRenderer {
  /**
   * @param {HTMLElement} container 
   * @param {{ labels: string[], datasets: Array<Object> }} chartData 
   * @param {string} title 
   */
  static render(container, chartData, title = '증가 화원사 TOP 10 발주 비교 차트') {
    const card = document.createElement('div');
    card.className = 'chart-card';

    card.innerHTML = `
      <div class="chart-header">
        <div class="chart-title">📊 ${title}</div>
        <div style="font-size: 11px; color: var(--text-secondary);">마우스 호버 시 상세 수치 확인</div>
      </div>
      <div class="chart-wrapper">
        <canvas id="analytics-chart-canvas"></canvas>
      </div>
    `;

    container.appendChild(card);

    const canvas = card.querySelector('#analytics-chart-canvas');
    const ctx = canvas.getContext('2d');

    // 이전 차트 인스턴스 정리
    if (window.currentActiveChart) {
      window.currentActiveChart.destroy();
    }

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    const textColor = isDark ? '#94a3b8' : '#475569';

    window.currentActiveChart = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'Pretendard, sans-serif', size: 12, weight: '600' },
              padding: 16
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                return ` ${context.dataset.label}: ${context.raw.toLocaleString()}건`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Pretendard, sans-serif', size: 11 }
            }
          },
          y: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Pretendard, sans-serif', size: 11 },
              callback: (val) => `${val}건`
            }
          }
        }
      }
    });
  }
}

window.ChartRenderer = ChartRenderer;
