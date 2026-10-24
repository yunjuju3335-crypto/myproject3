/**
 * 분석 모듈 확장 레지스트리 (registry.js)
 * 새로운 분석 모듈을 플러그인 형태로 등록하고 관리합니다.
 */
class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  register(module) {
    if (!module.id || !module.name || typeof module.execute !== 'function') {
      throw new Error(`유효하지 않은 모듈 규격입니다: ${JSON.stringify(module)}`);
    }
    this.modules.set(module.id, module);
    console.log(`[ModuleRegistry] 모듈 등록 완료: ${module.name} (${module.id})`);
  }

  get(id) {
    return this.modules.get(id);
  }

  getAll() {
    return Array.from(this.modules.values());
  }
}

window.moduleRegistry = new ModuleRegistry();

// 기본 모듈 등록
window.addEventListener('DOMContentLoaded', () => {
  if (window.OrderTrendModule) {
    window.moduleRegistry.register(window.OrderTrendModule);
  }
  if (window.FloristRankingModule) {
    window.moduleRegistry.register(window.FloristRankingModule);
  }
  if (window.ProductProgressModule) {
    window.moduleRegistry.register(window.ProductProgressModule);
  }
  if (window.ReceptionCountModule) {
    window.moduleRegistry.register(window.ReceptionCountModule);
  }
  if (window.ErrorAnalysisModule) {
    window.moduleRegistry.register(window.ErrorAnalysisModule);
  }
  if (window.StaffSummaryModule) {
    window.moduleRegistry.register(window.StaffSummaryModule);
  }
  if (window.HgsTrendModule) {
    window.moduleRegistry.register(window.HgsTrendModule);
  }
});
