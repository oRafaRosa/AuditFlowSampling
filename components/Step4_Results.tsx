import React from 'react';
import type { SampledItem, AuditParameters, TestResultInfo, DataRow } from '../types';
import { SamplingMethod } from '../types';
import * as XLSX from 'xlsx';

interface Step4Props {
  sampledData: SampledItem[];
  samplingMethod: SamplingMethod;
  parameters: AuditParameters;
  sampleSizeA: number;
  onNext: () => void;
  onBack: () => void;
  testResultInfo: TestResultInfo | null;
}

const Step4_Results: React.FC<Step4Props> = ({ sampledData, samplingMethod, parameters, sampleSizeA, onNext, onBack, testResultInfo }) => {

  const headers = sampledData.length > 0 ? Object.keys(sampledData[0]).filter(h => h !== '_originalIndex') : [];

  const initialSample = sampledData.slice(0, sampleSizeA);
  const complementarySample = testResultInfo && testResultInfo.complementarySampleSize > 0 ? sampledData.slice(sampleSizeA) : [];

  const exportToCSV = () => {
    if (sampledData.length === 0) return;
    const dataToExport = sampledData.map(row => {
        const cleanRow: Record<string, any> = {};
        headers.forEach(h => cleanRow[h] = row[h]);
        return cleanRow;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'amostra_auditflow.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();

    // --- Formalization Sheet ---
    const confidenceMap: Record<number, string> = { 1: "Baixo", 2: "Médio", 3: "Alto" };
    const riskMap: Record<number, string> = { 1: "Baixo", 2: "Médio", 3: "Alto", 4: "Crítico" };
    const maturityMap: Record<number, string> = { 1: "Baixa", 2: "Média", 3: "Alta" };

    const headerStyle = { font: { bold: true, sz: 12, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "0033C6" } } };
    const sectionHeaderStyle = { font: { bold: true, sz: 11 } };
    const wrapTextStyle = { alignment: { wrapText: true, vertical: "top" } };

    const wsData: any[][] = [
        [{ v: "Formalização de Seleção de Amostra de Auditoria", s: { font: { bold: true, sz: 14, color: { rgb: "0033C6" } } } }],
        [],
        [{ v: "1. Justificativa e Racional", s: headerStyle }, {}],
        [{ 
            v: "A seleção da amostra foi conduzida utilizando uma abordagem estatística para garantir que os itens selecionados sejam representativos da população total. O objetivo é obter evidência de auditoria suficiente e apropriada para suportar uma conclusão sobre as afirmações relevantes. Os parâmetros e o método de seleção foram definidos com base na avaliação de riscos do auditor e nos objetivos específicos do procedimento.", 
            s: wrapTextStyle 
        }, {}],
        [],
        [{ v: "2. Fonte e Preparação dos Dados", s: headerStyle }, {}],
        [{ v: parameters.dataExtractionInfo || "Nenhuma informação fornecida.", s: wrapTextStyle }, {}],
        [],
        [{ v: "3. Parâmetros da Amostragem", s: headerStyle }, {}],
        [{ v: "Data e Hora da Geração", s: sectionHeaderStyle }, new Date().toLocaleString()],
        [{ v: "Tamanho da População (N)", s: sectionHeaderStyle }, parameters.populationSize],
        [{ v: "Nível de Confiança (C)", s: sectionHeaderStyle }, confidenceMap[parameters.confidenceLevel]],
        [{ v: "Risco do Processo (R)", s: sectionHeaderStyle }, riskMap[parameters.processRisk]],
        [{ v: "Maturidade dos Controles (M)", s: sectionHeaderStyle }, maturityMap[parameters.controlsMaturity]],
        [{ v: "Erro Tolerável (T)", s: sectionHeaderStyle }, `${parameters.tolerableError}%`],
        [{ v: "Base Financeira?", s: sectionHeaderStyle }, parameters.isFinancial ? "Sim" : "Não"],
    ];
    
    if (parameters.isFinancial) {
        wsData.push([{ v: "Valor Total da Base", s: sectionHeaderStyle }, { v: parameters.totalValue, t: 'n', z: '"R$"#,##0.00' }]);
        wsData.push([{ v: "Valor Monetário Mínimo", s: sectionHeaderStyle }, { v: parameters.minMonetaryValue, t: 'n', z: '"R$"#,##0.00' }]);
    }

    wsData.push(
        [],
        [{ v: "4. Método e Tamanho da Amostra", s: headerStyle }, {}],
        [{ v: "Método de Seleção Utilizado", s: sectionHeaderStyle }, samplingMethod],
        [{ v: "Seed (Semente) Inicial", s: sectionHeaderStyle }, parameters.seed],
        [{ v: "Tamanho da Amostra Inicial (A)", s: sectionHeaderStyle }, sampleSizeA],
        [{ v: "Tamanho Total da Amostra Final", s: sectionHeaderStyle }, sampledData.length]
    );
    
    if (testResultInfo && testResultInfo.complementarySampleSize > 0) {
        wsData.push([], [{ v: "5. Testes e Amostra Complementar", s: headerStyle }, {}]);
        wsData.push([{ v: "Erros Encontrados (E)", s: sectionHeaderStyle }, testResultInfo.errorsFound]);
        
        if (!parameters.isFinancial) {
             wsData.push([{ v: "Impacto Qualitativo", s: sectionHeaderStyle }, testResultInfo.qualitativeImpact]);
             wsData.push([{ v: "Justificativa Racional", s: { ...sectionHeaderStyle, ...wrapTextStyle } }, { v: testResultInfo.rationale, s: wrapTextStyle }]);
        }

        wsData.push([{ v: "Tamanho da Amostra Complementar", s: sectionHeaderStyle }, testResultInfo.complementarySampleSize]);
        if(testResultInfo.complementarySeed) {
            wsData.push([{ v: "Seed (Semente) Complementar", s: sectionHeaderStyle }, testResultInfo.complementarySeed]);
        }
    }
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 30 }, { wch: 50 }];

    const merges: XLSX.Range[] = [];
    wsData.forEach((row, r) => {
        // Merge cells for headers and text blocks that span the width
        if (row.length === 2 && row[1] && Object.keys(row[1]).length === 0) {
            merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
        }
    });
    ws['!merges'] = merges;
    
    XLSX.utils.book_append_sheet(wb, ws, "Formalização");

    // --- Initial Sample Sheet ---
    const initialDataExport = initialSample.map(row => {
        const newRow: DataRow = {};
        headers.forEach(header => newRow[header] = row[header]);
        return newRow;
    });
    const wsInitial = XLSX.utils.json_to_sheet(initialDataExport);
    XLSX.utils.book_append_sheet(wb, wsInitial, "Amostra Inicial");

    // --- Complementary Sample Sheet ---
    if (complementarySample.length > 0) {
        const complementaryDataExport = complementarySample.map(row => {
            const newRow: DataRow = {};
            headers.forEach(header => newRow[header] = row[header]);
            return newRow;
        });
        const wsComplementary = XLSX.utils.json_to_sheet(complementaryDataExport);
        XLSX.utils.book_append_sheet(wb, wsComplementary, "Amostra Complementar");
    }

    XLSX.writeFile(wb, "Formalizacao_Amostra_AuditFlow.xlsx");
  };
  
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl animate-fade-in">
      <h2 className="text-2xl font-bold text-[#0033C6] mb-2">📋 Etapa 4: Resultado da Amostragem</h2>
      <div className="mb-4 text-gray-700">
        <p><span className="font-bold">Método Utilizado:</span> {samplingMethod}</p>
        <p><span className="font-bold">Tamanho da Amostra Inicial:</span> {sampleSizeA}</p>
        {complementarySample.length > 0 && <p><span className="font-bold">Amostra Complementar:</span> {complementarySample.length}</p>}
        <p><span className="font-bold">Itens Totais na Amostra:</span> {sampledData.length}</p>
      </div>
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={exportToCSV} className="px-4 py-2 bg-[#10B981] text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 flex items-center space-x-2">
          <span>Exportar para .CSV</span>
        </button>
        <button onClick={exportToXLSX} className="px-4 py-2 bg-[#217346] text-white font-bold rounded-lg shadow-md hover:bg-green-800 transition-all duration-300 flex items-center space-x-2">
          <span>Exportar para .XLSX (Formalização)</span>
        </button>
      </div>

      <div className="overflow-auto max-h-[50vh] rounded-lg border">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs text-gray-700 uppercase sticky top-0">
            <tr>
              {headers.map(h => <th key={h} className="px-4 py-2 font-bold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sampledData.map((row) => (
              <tr key={row._originalIndex} className={`hover:bg-blue-50 ${row._originalIndex < initialSample[initialSample.length-1]?._originalIndex && complementarySample.length>0 ? 'bg-white' : 'bg-yellow-50'}`}>
                {headers.map(h => (
                  <td key={`${row._originalIndex}-${h}`} className="px-4 py-2 truncate max-w-xs">{String(row[h])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300">
          Voltar
        </button>
        <button onClick={onNext} className="px-8 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-all duration-300 transform hover:scale-105">
          Próximo: Testar Resultados
        </button>
      </div>
    </div>
  );
};

export default Step4_Results;
