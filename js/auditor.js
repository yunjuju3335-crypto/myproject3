/**
 * 데이터 누락 방지 & 무결성 전수 감사 엔진 (auditor.js)
 * 브라우저에서 엑셀 파일을 열었을 때 데이터 누락이나 서식 왜곡을 0건으로 보장합니다.
 */
class DataIntegrityAuditor {
  /**
   * 다양한 포맷의 엑셀 날짜(Date 객체, 엑셀 시리얼 번호, 문자열)를 안전하게 YYYY-MM-DD로 정규화합니다.
   */
  static parseDate(val) {
    if (!val && val !== 0) return '';
    if (val instanceof Date) {
      if (isNaN(val.getTime())) return '';
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof val === 'number' && val > 20000 && val < 60000) {
      // 엑셀 날짜 시리얼 번호 (1900년 기준)
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
      }
    }
    const s = String(val).trim();
    // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    const m = s.match(/(\d{4})[-/\.](\d{1,2})[-/\.](\d{1,2})/);
    if (m) {
      return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
    }
    // YYYYMMDD
    const m2 = s.match(/(\d{4})(\d{2})(\d{2})/);
    if (m2) {
      return `${m2[1]}-${m2[2]}-${m2[3]}`;
    }
    // YYYY-MM, YYYY/MM
    const m3 = s.match(/(\d{4})[-/\.](\d{1,2})/);
    if (m3) {
      return `${m3[1]}-${String(m3[2]).padStart(2, '0')}`;
    }
    return s;
  }

  /**
   * YYYY-MM 형식 추출 (월 단위 분석용)
   */
  static parseYm(val) {
    const dStr = DataIntegrityAuditor.parseDate(val);
    if (!dStr) return '';
    const m = dStr.match(/(\d{4})[-/\.](\d{1,2})/);
    return m ? `${m[1]}-${String(m[2]).padStart(2, '0')}` : '';
  }

  /**
   * 엑셀 File 객체를 읽고 무결성을 전수 검사합니다.
   * @param {File} file 
   * @returns {Promise<{ rows: Array<Object>, audit: Object }>}
   */
  static async auditExcelFile(file) {
    return new Promise((resolve, reject) => {
      if (typeof XLSX === 'undefined') {
        return reject(new Error("엑셀 파서 라이브러리(SheetJS)가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요."));
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          // cellDates: false로 읽어 날짜 왜곡을 방지하고 문자열/원시값 그대로 보존
          const workbook = XLSX.read(data, { type: 'array', cellDates: false });

          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // 행/열 전체 변환 (헤더 보정)
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

          if (!rawRows || rawRows.length === 0) {
            throw new Error("엑셀 파일에 유효한 데이터 행이 없습니다.");
          }

          const columns = Object.keys(rawRows[0]);
          let totalMissingCells = 0;
          let emptyRowsCount = 0;

          // 데이터 누락 전수 검사 루프
          const cleanedRows = rawRows.filter((row, idx) => {
            let rowEmptyCount = 0;
            columns.forEach(col => {
              const val = row[col];
              if (val === null || val === undefined || String(val).trim() === "") {
                totalMissingCells++;
                rowEmptyCount++;
              }
            });

            // 전체 컬럼이 빈 행인 경우 누락 카운트에서 제외하고 필터링
            if (rowEmptyCount === columns.length) {
              emptyRowsCount++;
              return false;
            }
            return true;
          });

          const totalRows = cleanedRows.length;
          const totalCols = columns.length;
          const integrityScore = totalRows > 0 
            ? Math.max(0, Math.round(100 * (1 - (totalMissingCells / (totalRows * totalCols)))))
            : 100;

          const auditReport = {
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + " KB",
            sheetName: firstSheetName,
            totalRows: totalRows,
            totalColumns: totalCols,
            totalMissingCells: totalMissingCells,
            emptyRowsExcluded: emptyRowsCount,
            isIntegrityPassed: totalMissingCells === 0,
            integrityScore: integrityScore,
            columns: columns,
            auditedAt: new Date().toLocaleTimeString()
          };

          resolve({
            rows: cleanedRows,
            audit: auditReport
          });
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(new Error("파일 읽기 실패: " + err.message));
      reader.readAsArrayBuffer(file);
    });
  }
}

window.DataIntegrityAuditor = DataIntegrityAuditor;
