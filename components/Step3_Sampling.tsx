import React, { useState, useEffect } from 'react';
import { SamplingMethod } from '../types';

interface Step3Props {
  onSelectMethod: (method: SamplingMethod, column?: string) => void;
  onBack: () => void;
  headers: string[];
  isFinancial: boolean;
  seed: number;
  onSeedChange: (seed: number) => void;
}

const Step3_Sampling: React.FC<Step3Props> = ({ onSelectMethod, onBack, headers, isFinancial, seed, onSeedChange }) => {
  const [method, setMethod] = useState<SamplingMethod>(SamplingMethod.None);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [warning, setWarning] = useState<string>('');

  const handleMethodChange = (newMethod: SamplingMethod) => {
    setMethod(newMethod);
    setSelectedColumn('');
    setWarning('');
    if (newMethod === SamplingMethod.Systematic) {
        const hasDateOrCode = headers.some(h => h.toLowerCase().includes('data') || h.toLowerCase().includes('código'));
        if (hasDateOrCode) {
            setWarning('⚠️ Alerta: A base parece conter colunas de data ou código. A amostragem sistemática pode ser enviesada se a base estiver ordenada por essas colunas.');
        }
    }
  };

  const generateNewSeed = () => {
    onSeedChange(Math.floor(Math.random() * 1000000));
  };
  
  const copySeed = () => {
    navigator.clipboard.writeText(String(seed));
  };

  const isNextDisabled = () => {
    if (method === SamplingMethod.None) return true;
    if (method === SamplingMethod.Stratified && !selectedColumn) return true;
    if (method === SamplingMethod.MonetaryUnit && !selectedColumn) return true;
    if (!seed && seed !== 0) return true;
    return false;
  };

  const samplingOptions = [
    { id: SamplingMethod.SimpleRandom, label: "Aleatória Simples", description: "Todos os itens têm a mesma probabilidade de serem selecionados." },
    { id: SamplingMethod.Systematic, label: "Sistemática", description: "Sorteia um item inicial e depois seleciona a cada 'k' itens." },
    { id: SamplingMethod.Stratified, label: "Estratificada", description: "Divide a base em grupos (estratos) e seleciona proporcionalmente." },
    { id: SamplingMethod.MonetaryUnit, label: "Unidade Monetária (MUS)", description: "Sorteio com peso no valor. Quanto maior o valor, maior a chance.", financialOnly: true },
  ];

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl animate-fade-in">
      <h2 className="text-2xl font-bold text-[#0033C6] mb-6">🔍 Etapa 3: Tipo de Amostragem</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-1">Seed</label>
        <p className="text-xs text-gray-500 mb-2">O seed garante que a seleção da amostra seja 100% reprodutível.</p>
        <div className="flex space-x-2">
            <input 
                type="number"
                value={seed}
                onChange={e => onSeedChange(parseInt(e.target.value, 10) || 0)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]"
                placeholder="Insira um número"
            />
            <button onClick={generateNewSeed} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title="Gerar novo seed">🎲</button>
            <button onClick={copySeed} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300" title="Copiar seed">📋</button>
        </div>
      </div>
      
      <div className="space-y-4">
        {samplingOptions.map(opt => {
          if (opt.financialOnly && !isFinancial) return null;
          return (
            <div key={opt.id} onClick={() => handleMethodChange(opt.id)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${method === opt.id ? 'border-[#0033C6] bg-blue-50' : 'border-gray-300 hover:border-[#E71A3B]'}`}>
              <h3 className="font-bold text-lg text-[#0033C6]">{opt.label}</h3>
              <p className="text-sm text-gray-600">{opt.description}</p>
            </div>
          );
        })}
      </div>
      
      {warning && <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">{warning}</div>}

      {method === SamplingMethod.Stratified && (
        <div className="mt-6 animate-fade-in">
          <label className="block text-sm font-bold text-gray-700 mb-2">Selecione a coluna do estrato:</label>
          <select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
            <option value="">-- Selecione uma coluna --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      )}

      {method === SamplingMethod.MonetaryUnit && (
        <div className="mt-6 animate-fade-in">
          <label className="block text-sm font-bold text-gray-700 mb-2">Selecione a coluna de valor:</label>
          <select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
            <option value="">-- Selecione uma coluna --</option>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300">
          Voltar
        </button>
        <button 
          onClick={() => onSelectMethod(method, selectedColumn)} 
          disabled={isNextDisabled()}
          className="px-8 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          Gerar Amostra
        </button>
      </div>
    </div>
  );
};

export default Step3_Sampling;