import React, { useState, useEffect } from 'react';

interface GuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuidanceModal: React.FC<GuidanceModalProps> = ({ isOpen, onClose }) => {
  const [isChecked, setIsChecked] = useState(false);

  // Reset checkbox when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg m-4 transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold text-[#0033C6] mb-4">Orientações Iniciais</h2>
        <div className="text-gray-700 space-y-3 mb-6">
            <p>
                Os parâmetros a seguir são definidos com base no <strong>julgamento profissional do auditor</strong>, considerando as informações e o sentimento obtido em conversas iniciais.
            </p>
            <p>
                Eles são a base para <strong>formalizar e justificar</strong> o cálculo do tamanho da amostra.
            </p>
            <p className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg font-semibold">
                ⚠️ <span className="font-bold">Aviso Importante:</span> Se você não estiver seguro sobre como preencher algum campo, adote sempre uma postura <strong>conservadora (pior cenário)</strong>. Por exemplo, selecione um risco de processo mais alto ou uma maturidade de controles mais baixa.
            </p>
        </div>
        <div className="flex items-center space-x-2 mb-6">
            <input 
                type="checkbox" 
                id="guidance-understood" 
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
                className="h-5 w-5 text-[#0033C6] focus:ring-[#0033C6] border-gray-300 rounded"
            />
            <label htmlFor="guidance-understood" className="font-medium text-gray-800 cursor-pointer">
                Li e entendi as orientações.
            </label>
        </div>
        <button 
            onClick={onClose}
            disabled={!isChecked}
            className="w-full px-6 py-3 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
        >
            Prosseguir
        </button>
      </div>
    </div>
  );
};

export default GuidanceModal;
