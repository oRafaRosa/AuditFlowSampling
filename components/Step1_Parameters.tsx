
import React, { useState, useMemo, useEffect } from 'react';
import type { AuditParameters } from '../types';

interface Step1Props {
  parameters: AuditParameters;
  onParametersChange: (params: AuditParameters) => void;
  onNext: (sampleSize: number) => void;
}

const MAX_INITIAL_SAMPLE_SIZE = 25;

const R_WEIGHTS: Record<number, number> = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4 };
const M_WEIGHTS: Record<number, number> = { 1: 1.3, 2: 1.0, 3: 0.8 };
const C_WEIGHTS: Record<number, number> = { 1: 1.2, 2: 1.0, 3: 0.9 };

const Step1_Parameters: React.FC<Step1Props> = ({ parameters, onParametersChange, onNext }) => {
  const [localParams, setLocalParams] = useState<AuditParameters>(parameters);

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
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl animate-fade-in grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h2 className="text-2xl font-bold text-[#0033C6] mb-6">📊 Etapa 1: Parâmetros da Amostra</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tamanho da população (N)</label>
              <input type="number" name="populationSize" value={localParams.populationSize || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 15000" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nível de confiança (C)</label>
              <select name="confidenceLevel" value={localParams.confidenceLevel} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                <option value={1}>1 - Baixo</option>
                <option value={2}>2 - Médio</option>
                <option value={3}>3 - Alto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Risco do processo (R)</label>
              <select name="processRisk" value={localParams.processRisk} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                <option value={1}>1 - Baixo</option>
                <option value={2}>2 - Médio</option>
                <option value={3}>3 - Alto</option>
                <option value={4}>4 - Crítico</option>
              </select>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Maturidade dos controles (M)</label>
              <select name="controlsMaturity" value={localParams.controlsMaturity} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                <option value={1}>1 - Baixa</option>
                <option value={2}>2 - Média</option>
                <option value={3}>3 - Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Erro tolerável (T) (%)</label>
              <input type="number" name="tolerableError" value={localParams.tolerableError || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 5" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="isFinancial" name="isFinancial" checked={localParams.isFinancial} onChange={handleInputChange} className="h-4 w-4 text-[#0033C6] focus:ring-[#0033C6] border-gray-300 rounded" />
              <label htmlFor="isFinancial" className="font-bold text-gray-700">A base é financeira?</label>
            </div>
          </div>
        </div>
        {localParams.isFinancial && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Valor total da base</label>
              <input type="number" name="totalValue" value={localParams.totalValue || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 1000000.00"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Valor monetário mínimo</label>
              <input type="number" name="minMonetaryValue" value={localParams.minMonetaryValue || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" placeholder="Ex: 500.00" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 text-center">Tamanho da Amostra Inicial (A)</h3>
          <p className="text-7xl font-bold text-[#E71A3B] my-2 text-center relative">
            {calculatedSampleSize}
            {calculatedSampleSize === MAX_INITIAL_SAMPLE_SIZE && (
              <span className="absolute top-0 -right-2 text-xs bg-[#E71A3B] text-white font-bold px-2 py-1 rounded-full">TETO ATINGIDO</span>
            )}
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg">
            <h4 className="font-bold mb-1">Entenda o Cálculo</h4>
            <p>O cálculo usa crescimento logarítmico e pondera risco, maturidade dos controles, confiança e erro tolerável. A amostra inicial é limitada a <strong>{MAX_INITIAL_SAMPLE_SIZE} itens</strong>. Caso os resultados dos testes indiquem necessidade, o app sugere uma amostra complementar (máx. 15 itens).</p>
          </div>
        </div>
        <div className="mt-6 text-center">
            <button 
                onClick={() => onNext(calculatedSampleSize)} 
                disabled={!isFormValid || calculatedSampleSize === 0}
                className="w-full px-8 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
                Próximo: Upload da Base
            </button>
        </div>
      </div>
    </div>
  );
};

export default Step1_Parameters;
