import React, { useState, useMemo, useEffect } from 'react';
import type { AuditParameters } from '../types';
import Tooltip from './Tooltip';
import GuidanceModal from './GuidanceModal';

interface Step1Props {
  parameters: AuditParameters;
  onParametersChange: (params: AuditParameters) => void;
  onNext: (sampleSize: number) => void;
}

const MAX_INITIAL_SAMPLE_SIZE = 25;

const R_WEIGHTS: Record<number, number> = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4 };
const M_WEIGHTS: Record<number, number> = { 1: 1.3, 2: 1.0, 3: 0.8 };
const C_WEIGHTS: Record<number, number> = { 1: 1.2, 2: 1.0, 3: 0.9 };

const QuestionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-[#0033C6] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const Step1_Parameters: React.FC<Step1Props> = ({ parameters, onParametersChange, onNext }) => {
  const [localParams, setLocalParams] = useState<AuditParameters>(parameters);
  const [isGuidanceModalOpen, setIsGuidanceModalOpen] = useState(true);

  const calculatedSampleSize = useMemo(() => {
    const { populationSize, processRisk, controlsMaturity, confidenceLevel, tolerableError } = localParams;
    if (populationSize <= 0 || tolerableError <= 0) return 0;
    
    const N = populationSize;
    const R = processRisk;
    const M = controlsMaturity;
    const C = confidenceLevel;
    const T_decimal = tolerableError / 100;

    const base = Math.max(1, Math.log10(Math.max(N, 10)) * 4);
    const rawSampleSize = base * R_WEIGHTS[R] * M_WEIGHTS[M] * C_WEIGHTS[C] * (1 + T_decimal);
    const cappedSampleSize = Math.min(MAX_INITIAL_SAMPLE_SIZE, Math.round(rawSampleSize));
    
    return Math.min(cappedSampleSize, N); // Sample size cannot exceed population size
  }, [localParams]);

  useEffect(() => {
    onParametersChange(localParams);
  }, [localParams, onParametersChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLocalParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalParams(prev => ({ ...prev, [name]: parseInt(value, 10) }));
  };

  const isFormValid = localParams.populationSize > 0 && localParams.tolerableError > 0;

  return (
    <>
      <GuidanceModal 
        isOpen={isGuidanceModalOpen}
        onClose={() => setIsGuidanceModalOpen(false)}
      />
    
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-[#0033C6] mb-6 flex items-center gap-2">
            📊 Etapa 1: Parâmetros da Amostra
            <button 
                onClick={() => setIsGuidanceModalOpen(true)}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Mostrar orientações iniciais"
                title="Mostrar orientações iniciais"
            >
                <QuestionIcon />
            </button>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                  <label htmlFor="populationSize" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Tamanho da população (N)</span>
                      <Tooltip text="O número total de itens (ex: transações, faturas) na base de dados que será auditada. Deve corresponder ao número de linhas do arquivo carregado.">
                          <QuestionIcon />
                      </Tooltip>
                  </label>
                  <input id="populationSize" type="number" name="populationSize" value={localParams.populationSize || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 15000" />
              </div>
              <div>
                  <label htmlFor="confidenceLevel" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Nível de confiança (C)</span>
                      <Tooltip text={
                        "Julgamento do auditor sobre a confiança na base e no sistema de origem. " +
                        "Um nível de confiança menor (indicando maior incerteza) exige uma amostra maior para obter segurança.\n" +
                        "Refere-se exclusivamente à integridade da base de dados usada para a seleção (não é confiança no processo ou na área).\n\n" +
                        "Exemplos:\n" +
                        "• Alta confiança: base extraída de sistema confiável (ex.: SAP) pelo próprio auditor ou com acompanhamento; logs/reconciliações ok.\n" +
                        "• Baixa confiança: base produzida manualmente (planilhas), ou de sistemas com erros/bugs e sem trilha de auditoria."
                      }>
                        <QuestionIcon />
                      </Tooltip>
                  </label>
                  <select id="confidenceLevel" name="confidenceLevel" value={localParams.confidenceLevel} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                      <option value={1}>1 - Baixo</option>
                      <option value={2}>2 - Médio</option>
                      <option value={3}>3 - Alto</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="processRisk" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Risco do processo (R)</span>
                      <Tooltip text="Avaliação do risco inerente ao processo ou sistema. Um risco maior aumenta o tamanho da amostra.">
                         <QuestionIcon />
                      </Tooltip>
                  </label>
                  <select id="processRisk" name="processRisk" value={localParams.processRisk} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                      <option value={1}>1 - Baixo</option>
                      <option value={2}>2 - Médio</option>
                      <option value={3}>3 - Alto</option>
                      <option value={4}>4 - Crítico</option>
                  </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                  <label htmlFor="controlsMaturity" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Maturidade dos controles (M)</span>
                      <Tooltip text="Análise preliminar dos controles existentes com base em conversas iniciais. Controles maduros podem reduzir o tamanho da amostra.">
                          <QuestionIcon />
                      </Tooltip>
                  </label>
                  <select id="controlsMaturity" name="controlsMaturity" value={localParams.controlsMaturity} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                      <option value={1}>1 - Baixa</option>
                      <option value={2}>2 - Média</option>
                      <option value={3}>3 - Alta</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="tolerableError" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Erro tolerável (T) (%)</span>
                      <Tooltip text="O percentual de exceções (erros) que o auditor está disposto a aceitar nos resultados do teste. Nesta metodologia, um valor maior para o erro tolerável exige uma amostra maior.">
                          <QuestionIcon />
                      </Tooltip>
                  </label>
                  <input id="tolerableError" type="number" name="tolerableError" value={localParams.tolerableError || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 5" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="isFinancial" name="isFinancial" checked={localParams.isFinancial} onChange={handleInputChange} className="h-4 w-4 text-[#0033C6] focus:ring-[#0033C6] border-gray-300 rounded" />
                  <label htmlFor="isFinancial" className="flex items-center space-x-1.5 font-bold text-gray-700">
                  <span>A base é financeira?</span>
                   <Tooltip text="Selecione esta opção apenas quando o principal atributo do teste é o valor monetário (principal risco da base).">
                        <QuestionIcon />
                    </Tooltip>
                </label>
              </div>
            </div>
          </div>
          {localParams.isFinancial && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in">
              <div>
                  <label htmlFor="totalValue" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Valor total da base</span>
                      <Tooltip text="A soma de todos os valores monetários na população. Essencial para amostragem MUS e para calcular o erro projetado.">
                          <QuestionIcon />
                      </Tooltip>
                  </label>
                  <input id="totalValue" type="number" name="totalValue" value={localParams.totalValue || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 1000000.00"/>
              </div>
              <div>
                  <label htmlFor="minMonetaryValue" className="flex items-center space-x-1.5 text-sm font-bold text-gray-700 mb-1">
                      <span>Valor monetário mínimo</span>
                      <Tooltip text="Itens com valor acima deste montante podem ser selecionados automaticamente para garantir a cobertura de itens de alto valor.">
                          <QuestionIcon />
                      </Tooltip>
                  </label>
                  <input id="minMonetaryValue" type="number" name="minMonetaryValue" value={localParams.minMonetaryValue || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 500.00" />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 text-center flex items-center justify-center space-x-2">
            <span>Tamanho da Amostra Inicial (A)</span>
            <Tooltip text={`O cálculo usa crescimento logarítmico e pondera risco, maturidade dos controles, confiança e erro tolerável. A amostra inicial é limitada a ${MAX_INITIAL_SAMPLE_SIZE} itens. Caso os resultados dos testes indiquem necessidade, o app sugere uma amostra complementar (máx. 15 itens).`}>
              <QuestionIcon />
            </Tooltip>
            </h3>
            <p className="text-7xl font-bold text-[#E71A3B] my-2 text-center relative">
              {calculatedSampleSize}
              {calculatedSampleSize === MAX_INITIAL_SAMPLE_SIZE && (
                <span className="absolute top-0 -right-2 text-xs bg-[#E71A3B] text-white font-bold px-2 py-1 rounded-full">TETO ATINGIDO</span>
              )}
            </p>
            
          <div className="mt-6 text-center">
              <button 
                  onClick={() => onNext(calculatedSampleSize)} 
                  disabled={!isFormValid || calculatedSampleSize === 0}
                  className="w-full px-8 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                  Próximo: Seleção Manual
              </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};