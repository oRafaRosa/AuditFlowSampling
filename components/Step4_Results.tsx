import React, { useState, useEffect } from 'react';
import type { SampledItem, AuditParameters, TestResultInfo, DataRow } from '../types';
import { SamplingMethod } from '../types';
import { utils, writeFile, type Range as XLSXRange } from 'xlsx';

interface Step4Props {
  sampledData: SampledItem[];
  samplingMethod: SamplingMethod;
  parameters: AuditParameters;
  initialSampleSize: number;
  sampleSizeA: number;
  onNext: () => void;
  onBack: () => void;
  testResultInfo: TestResultInfo | null;
  replacementInfo: { seed: number; replacedCount: number; } | null;
  onReplaceItems: (indices: number[], seed: number) => void;
}

const Step4_Results: React.FC<Step4Props> = ({ 
  sampledData, 
  samplingMethod, 
  parameters, 
  initialSampleSize,
  sampleSizeA, 
  onNext, 
  onBack, 
  testResultInfo,
  replacementInfo,
  onReplaceItems
}) => {
  
  const [itemsToReplace, setItemsToReplace] = useState<Set<number>>(new Set());
  const [replacementSeed, setReplacementSeed] = useState<number | undefined>();

  useEffect(() => {
    // Generate a default seed for replacement when user starts selecting items
    if (itemsToReplace.size > 0 && replacementSeed === undefined) {
      setReplacementSeed(Math.floor(Math.random() * 1000000));
    }
    // Clear seed if no items are selected anymore
    if (itemsToReplace.size === 0) {
      setReplacementSeed(undefined);
    }
  }, [itemsToReplace.size]);

  const headers = sampledData.length > 0 ? Object.keys(sampledData[0]).filter(h => !h.startsWith('_')) : [];

  const initialSample = sampledData.slice(0, sampleSizeA);
  const complementarySample = testResultInfo && testResultInfo.complementarySampleSize > 0 ? sampledData.slice(sampleSizeA) : [];

  const handleCheckboxChange = (index: number, isChecked: boolean) => {
    setItemsToReplace(prev => {
        const newSet = new Set(prev);
        if (isChecked) {
            newSet.add(index);
        } else {
            newSet.delete(index);
        }
        return newSet;
    });
  };

  const handleReplaceClick = () => {
    if (replacementSeed === undefined) return;
    onReplaceItems(Array.from(itemsToReplace), replacementSeed);
    setItemsToReplace(new Set());
  };

  const exportToCSV = () => {
    if (sampledData.length === 0) return;
    const dataToExport = sampledData.map(row => {
        const cleanRow: Record<string, any> = {};
        headers.forEach(h => cleanRow[h] = row[h]);
        return cleanRow;
    });

    const ws = utils.json_to_sheet(dataToExport);
    const csv = utils.sheet_to_csv(ws);
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
    const wb = utils.book_new();

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
        [{ v: "1. Justificativa e Racional", s: headerStyle }],
        [{ 
            v: "A seleção da amostra foi conduzida utilizando uma abordagem estatística para garantir que os itens selecionados sejam representativos da população total. O objetivo é obter evidência de auditoria suficiente e apropriada para suportar uma conclusão sobre as afirmações relevantes. Os parâmetros e o método de seleção foram definidos com base na avaliação de riscos do auditor e nos objetivos específicos do procedimento.", 
            s: wrapTextStyle 
        }],
        [],
        [{ v: "2. Fonte e Preparação dos Dados", s: headerStyle }],
        [{ v: parameters.dataExtractionInfo || "Nenhuma informação fornecida.", s: wrapTextStyle }],
        [],
        [{ v: "3. Parâmetros da Amostragem", s: headerStyle }],
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

    let sectionCounter = 4;
    const totalItemsToTest = sampledData.length + (parameters.hasTargetSelection ? parameters.targetSelectionCount : 0);

    wsData.push(
        [],
        [{ v: `${sectionCounter}. Método e Tamanho da Amostra`, s: headerStyle }],
        [{ v: "Método de Seleção Utilizado", s: sectionHeaderStyle }, samplingMethod],
        [{ v: "Seed (Semente) Inicial", s: sectionHeaderStyle }, parameters.seed],
        [{ v: "Amostra Estatística (Base)", s: sectionHeaderStyle }, initialSampleSize]
    );
     if (parameters.hasTargetSelection) {
        wsData.push([{ v: "Ajuste por Itens a Target", s: sectionHeaderStyle }, -parameters.targetSelectionCount]);
    }
     wsData.push(
        [{ v: "Tamanho Amostra Estatística Inicial (A)", s: sectionHeaderStyle }, sampleSizeA],
        [{ v: "Amostra Complementar", s: sectionHeaderStyle }, testResultInfo?.complementarySampleSize || 0],
        [{ v: "Tamanho Total da Amostra Estatística", s: sectionHeaderStyle }, sampledData.length]
    );
     if (parameters.hasTargetSelection) {
        wsData.push([{ v: "Itens a Target (Seleção Manual)", s: sectionHeaderStyle }, parameters.targetSelectionCount]);
        wsData.push([{ v: "Tamanho Total a Ser Testado (Amostra + Target)", s: sectionHeaderStyle }, totalItemsToTest]);
    }
    sectionCounter++;

    if (parameters.hasTargetSelection) {
        wsData.push(
            [],
            [{ v: `${sectionCounter}. Racional da Seleção Manual (Target)`, s: headerStyle }]
        );
        if (parameters.isFinancial) {
             wsData.push([
                { v: "Valor Total dos Itens a Target", s: sectionHeaderStyle }, 
                { v: parameters.targetSelectionValue, t: 'n', z: '"R$"#,##0.00' }
            ]);
        }
        wsData.push([{ v: parameters.targetSelectionRationale || "Nenhum racional fornecido.", s: wrapTextStyle }]);
        sectionCounter++;
    }
    
    if (replacementInfo) {
      wsData.push(
        [],
        [{ v: `${sectionCounter}. Substituição de Itens Duplicados`, s: headerStyle }],
        [{ v: "Itens Substituídos", s: sectionHeaderStyle }, replacementInfo.replacedCount],
        [{ v: "Seed de Substituição", s: sectionHeaderStyle }, replacementInfo.seed],
        [{ v: "Justificativa", s: sectionHeaderStyle}, "Itens da amostra estatística foram substituídos por serem duplicados de itens já selecionados manualmente (Target)."]
      );
      sectionCounter++;
    }

    if (testResultInfo && testResultInfo.complementarySampleSize > 0) {
        wsData.push([], [{ v: `${sectionCounter}. Testes e Amostra Complementar`, s: headerStyle }]);
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
    
    const ws = utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 30 }, { wch: 50 }];

    const merges: XLSXRange[] = [];
    wsData.forEach((row, r) => {
        // Only merge rows where the first cell has the main `headerStyle`
        // and is intended to span two columns. This prevents accidental merging.
        if (row.length === 2 && row[1] instanceof Object && Object.keys(row[1]).length === 0) {
            merges.push({ s: { r, c: 0 }, e: { r, c: 1 } });
        }
    });
    ws['!merges'] = merges;
    
    utils.book_append_sheet(wb, ws, "Formalização");

    const dataToSheet = (data: SampledItem[]) => {
        return data.map(row => {
            const newRow: DataRow = {};
            headers.forEach(header => newRow[header] = row[header]);
            return newRow;
        });
    };

    const allStatisticalSample = dataToSheet(sampledData);
    if (allStatisticalSample.length > 0) {
        const wsSample = utils.json_to_sheet(allStatisticalSample);
        utils.book_append_sheet(wb, wsSample, "Amostra Estatística Total");
    }

    writeFile(wb, "Formalizacao_Amostra_AuditFlow.xlsx");
  };
  
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-6xl animate-fade-in">
      <h2 className="text-2xl font-bold text-[#0033C6] mb-2">📋 Etapa 4: Resultado da Amostragem</h2>
      <div className="mb-4 text-gray-700">
        <p><span className="font-bold">Método Utilizado:</span> {samplingMethod}</p>
        <p><span className="font-bold">Tamanho da Amostra Inicial (Base):</span> {initialSampleSize}</p>
        {parameters.hasTargetSelection && <p><span className="font-bold">Ajuste por Itens Target:</span> {-parameters.targetSelectionCount}</p>}
        <p><span className="font-bold">Tamanho da Amostra Estatística (A):</span> {sampleSizeA}</p>
        {complementarySample.length > 0 && <p><span className="font-bold">Amostra Complementar:</span> {complementarySample.length}</p>}
        <p><span className="font-bold">Itens Totais na Amostra Estatística:</span> {sampledData.length}</p>
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
              {parameters.hasTargetSelection && <th className="px-2 py-2 font-bold text-center">Duplicado?</th>}
              {headers.map(h => <th key={h} className="px-4 py-2 font-bold">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sampledData.map((row) => (
              <tr key={row._originalIndex} className={`transition-colors duration-300 ${row._isReplacement ? 'bg-green-100 hover:bg-green-200' : 'hover:bg-blue-50'}`}>
                {parameters.hasTargetSelection && (
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      onChange={(e) => handleCheckboxChange(row._originalIndex, e.target.checked)}
                      checked={itemsToReplace.has(row._originalIndex)}
                      aria-label={`Marcar item ${row._originalIndex} como duplicado`}
                    />
                  </td>
                )}
                {headers.map(h => (
                  <td key={`${row._originalIndex}-${h}`} className="px-4 py-2 truncate max-w-xs">{String(row[h])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {parameters.hasTargetSelection && (
          <div className="mt-6 p-4 border-2 border-dashed rounded-lg bg-gray-50">
              <h4 className="font-bold text-gray-800">Substituir Itens Duplicados do Target</h4>
              <p className="text-sm text-gray-600 my-2">Se algum item da amostra acima já foi selecionado por você manualmente (Target), marque-o na coluna "Duplicado?" e clique em substituir.</p>
              
              {itemsToReplace.size > 0 && (
                 <div className="my-4 animate-fade-in">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Seed de Substituição</label>
                    <p className="text-xs text-gray-500 mb-2">Este seed garante que a seleção dos itens substituídos seja reprodutível.</p>
                    <input 
                        type="number" 
                        value={replacementSeed ?? ''} 
                        onChange={e => setReplacementSeed(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                        className="w-full max-w-xs p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" 
                        placeholder="Seed obrigatório"/>
                 </div>
              )}

              <button
                  onClick={handleReplaceClick}
                  disabled={itemsToReplace.size === 0 || replacementSeed === undefined}
                  className="px-5 py-2 bg-orange-500 text-white font-bold rounded-lg shadow-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                  Substituir {itemsToReplace.size > 0 ? `${itemsToReplace.size} ` : ''}Itens
              </button>
          </div>
      )}


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