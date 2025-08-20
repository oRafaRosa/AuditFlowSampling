import React from 'react';
import type { AuditParameters } from '../types';

interface Step1_5_TargetProps {
  parameters: AuditParameters;
  onParametersChange: (params: AuditParameters) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step1_5_Target: React.FC<Step1_5_TargetProps> = ({ parameters, onParametersChange, onNext, onBack }) => {
  const handleToggle = (hasTarget: boolean) => {
    onParametersChange({
      ...parameters,
      hasTargetSelection: hasTarget,
      targetSelectionCount: hasTarget ? parameters.targetSelectionCount : 0,
      targetSelectionValue: hasTarget ? parameters.targetSelectionValue : 0,
      targetSelectionRationale: hasTarget ? parameters.targetSelectionRationale : '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    onParametersChange({
      ...parameters,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const isFormValid = !parameters.hasTargetSelection || (parameters.targetSelectionCount > 0 && parameters.targetSelectionRationale.trim() !== '');

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl animate-fade-in">
      <h2 className="text-2xl font-bold text-[#0033C6] mb-6">🎯 Seleção de Itens a Target (Manual)</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Você possui itens pré-selecionados para teste (Target)?</label>
        <p className="text-xs text-gray-500 mb-3">
          Itens a Target são transações ou registros selecionados manualmente com base no julgamento profissional do auditor, geralmente por serem de alto valor, alto risco ou representarem anomalias conhecidas.
        </p>
        <div className="flex space-x-4">
          <button 
            onClick={() => handleToggle(true)}
            className={`w-full py-2 rounded-lg font-bold transition-all ${parameters.hasTargetSelection ? 'bg-[#0033C6] text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Sim
          </button>
          <button 
            onClick={() => handleToggle(false)}
            className={`w-full py-2 rounded-lg font-bold transition-all ${!parameters.hasTargetSelection ? 'bg-[#0033C6] text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Não
          </button>
        </div>
      </div>
      
      {parameters.hasTargetSelection && (
        <div className="space-y-4 animate-fade-in border-t pt-6">
          <div>
            <label htmlFor="targetSelectionCount" className="block text-sm font-bold text-gray-700 mb-1">
              Quantidade de itens selecionados a Target <span className="text-red-500">*</span>
            </label>
            <input 
              id="targetSelectionCount" 
              type="number" 
              name="targetSelectionCount" 
              value={parameters.targetSelectionCount || ''} 
              onChange={handleChange} 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" 
              placeholder="Ex: 5"
            />
          </div>

          {parameters.isFinancial && (
            <div>
              <label htmlFor="targetSelectionValue" className="block text-sm font-bold text-gray-700 mb-1">
                Valor total desses itens
              </label>
              <input 
                id="targetSelectionValue" 
                type="number" 
                name="targetSelectionValue" 
                value={parameters.targetSelectionValue || ''} 
                onChange={handleChange} 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" 
                placeholder="Ex: 250000.00"
              />
            </div>
          )}

          <div>
            <label htmlFor="targetSelectionRationale" className="block text-sm font-bold text-gray-700 mb-1">
              Racional da seleção <span className="text-red-500">*</span>
            </label>
             <p className="text-xs text-gray-500 mb-2">
              Descreva o critério utilizado para selecionar manualmente esses itens. Esta informação constará na formalização.
            </p>
            <textarea
              id="targetSelectionRationale"
              name="targetSelectionRationale"
              rows={4}
              value={parameters.targetSelectionRationale}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]"
              placeholder="Ex: Seleção de todos os itens acima de R$ 50.000,00 e/ou transações com fornecedores de alto risco identificados em trabalhos anteriores."
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300">
          Voltar
        </button>
        <button 
          onClick={onNext}
          disabled={!isFormValid}
          className="px-8 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          Próximo: Upload da Base
        </button>
      </div>
    </div>
  );
};

export default Step1_5_Target;