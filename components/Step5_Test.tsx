import React, { useState, useMemo, useEffect } from 'react';
import { QualitativeImpact, AuditParameters } from '../types';

interface Step5Props {
  parameters: AuditParameters;
  initialSampledDataCount: number;
  onRestart: () => void;
  onBack: () => void;
  onGenerateComplementarySample: (size: number, errors: number, impact: QualitativeImpact, rationale: string, complementarySeed: number) => void;
}

const MAX_COMPLEMENTARY_SAMPLE = 15;
const MAX_TOTAL_SAMPLE = 80;

const Step5_Test: React.FC<Step5Props> = ({ parameters, initialSampledDataCount, onRestart, onBack, onGenerateComplementarySample }) => {
  const [errorsFound, setErrorsFound] = useState<number>(0);
  const [qualitativeImpact, setQualitativeImpact] = useState<QualitativeImpact>(QualitativeImpact.None);
  const [rationale, setRationale] = useState('');
  const [complementarySeed, setComplementarySeed] = useState<number | undefined>();
  const [showResults, setShowResults] = useState(false);
  const [formError, setFormError] = useState('');

  const observedError = useMemo(() => {
    if (initialSampledDataCount === 0) return 0;
    return (errorsFound / initialSampledDataCount) * 100;
  }, [errorsFound, initialSampledDataCount]);
  
  const complementarySampleSize = useMemo(() => {
    if (errorsFound === 0) return 0;
    
    let complement = 0;
    if (parameters.isFinancial) {
        const tolerableErrorDecimal = parameters.tolerableError / 100;
        const isSufficient = observedError <= parameters.tolerableError;
        if (isSufficient) return 0;

        const requiredTotalSize = Math.ceil(errorsFound / tolerableErrorDecimal);
        complement = requiredTotalSize - initialSampledDataCount;
    } else {
        if (qualitativeImpact === QualitativeImpact.None) return 0;
        const impactFactor = {
            [QualitativeImpact.Low]: 0.5,
            [QualitativeImpact.Medium]: 1.0,
            [QualitativeImpact.High]: 1.5,
        }[qualitativeImpact] || 0;
        complement = Math.round(errorsFound * impactFactor);
    }
    
    return Math.min(MAX_COMPLEMENTARY_SAMPLE, Math.max(0, complement));
  }, [errorsFound, parameters, observedError, qualitativeImpact, initialSampledDataCount]);

  useEffect(() => {
    // Set default complementary seed when analysis requires it and it's not set
    if (showResults && complementarySampleSize > 0 && complementarySeed === undefined) {
      setComplementarySeed(parameters.seed);
    }
    // Reset when no longer needed to ensure it's re-defaulted on next analysis
    if ((!showResults || complementarySampleSize === 0) && complementarySeed !== undefined) {
      setComplementarySeed(undefined);
    }
  }, [showResults, complementarySampleSize, parameters.seed, complementarySeed]);
  
  const isSufficient = parameters.isFinancial ? observedError <= parameters.tolerableError : errorsFound === 0;

  const totalSampleSize = initialSampledDataCount + complementarySampleSize;
  const totalSampleExceedsLimit = totalSampleSize > MAX_TOTAL_SAMPLE;

  const handleAnalyse = () => {
    setFormError('');
    if (!parameters.isFinancial && errorsFound > 0) {
      if (qualitativeImpact === QualitativeImpact.None) {
        setFormError('O "Impacto Qualitativo" é obrigatório quando há erros.');
        return;
      }
      if (!rationale.trim()) {
        setFormError('A "Justificativa Racional" é obrigatória quando há erros.');
        return;
      }
    }
    setShowResults(true);
  };
  
  const handleGenerate = () => {
     if (complementarySeed === undefined) return;
     onGenerateComplementarySample(complementarySampleSize, errorsFound, qualitativeImpact, rationale, complementarySeed);
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl animate-fade-in">
      <h2 className="text-2xl font-bold text-[#0033C6] mb-6">🧪 Etapa 5: Teste e Registro dos Resultados</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="errorsFound" className="block text-sm font-bold text-gray-700 mb-1">Quantidade de erros encontrados na amostra inicial (E)</label>
          <input 
            type="number" 
            id="errorsFound"
            value={errorsFound || ''}
            onChange={(e) => {
                setErrorsFound(Math.max(0, parseInt(e.target.value) || 0));
                setShowResults(false);
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]"
            placeholder="0"
          />
        </div>
        {!parameters.isFinancial && errorsFound > 0 && (
          <div className="animate-fade-in space-y-4">
             <div>
                <label htmlFor="qualitativeImpact" className="block text-sm font-bold text-gray-700 mb-1">Impacto qualitativo dos erros</label>
                <select id="qualitativeImpact" value={qualitativeImpact} onChange={e => setQualitativeImpact(e.target.value as QualitativeImpact)} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#0033C6]">
                    <option value={QualitativeImpact.None}>-- Selecione o impacto --</option>
                    <option value={QualitativeImpact.Low}>Pouco relevante</option>
                    <option value={QualitativeImpact.Medium}>Relevante</option>
                    <option value={QualitativeImpact.High}>Muito relevante</option>
                </select>
             </div>
             <div>
              <label htmlFor="rationale" className="block text-sm font-bold text-gray-700 mb-1">Justificativa racional (tipo dos erros, comentários)</label>
              <textarea 
                id="rationale"
                rows={3}
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]"
                placeholder="Descreva a natureza e o contexto dos erros encontrados..."
              />
            </div>
          </div>
        )}
      </div>
      
      {formError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">{formError}</div>}
      
      <div className="mt-6 text-center">
        <button onClick={handleAnalyse} className="px-8 py-3 bg-[#E71A3B] text-white font-bold rounded-lg shadow-md hover:bg-red-700 transition-all duration-300 transform hover:scale-105">
          Analisar Resultados
        </button>
      </div>

      {showResults && (
        <div className="mt-8 pt-6 border-t border-gray-200 animate-fade-in space-y-4">
          <h3 className="text-xl font-bold text-center text-gray-800 mb-4">Análise da Amostra</h3>
          
          {parameters.isFinancial && (
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-semibold text-gray-600">Erro Tolerável (T)</p>
                <p className="text-2xl font-bold text-[#0033C6]">{parameters.tolerableError.toFixed(2)}%</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-semibold text-gray-600">Erro Observado</p>
                <p className="text-2xl font-bold text-[#E71A3B]">{observedError.toFixed(2)}%</p>
                </div>
            </div>
          )}

          {isSufficient ? (
            <div className="p-4 text-center bg-green-100 border border-green-400 text-green-800 rounded-lg">
              <h4 className="font-bold text-lg">✅ Amostra Suficiente.</h4>
              <p>{parameters.isFinancial ? 'O erro observado está dentro do limite tolerável.' : 'Nenhum erro foi encontrado.'} O teste pode ser concluído.</p>
            </div>
          ) : (
            <div className="p-4 text-center bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg">
              <h4 className="font-bold text-lg">⚠️ Amostra Insuficiente.</h4>
              <p>{parameters.isFinancial ? 'O erro observado excede o limite tolerável.' : 'Foram encontrados erros.'} É necessário expandir o teste.</p>
              <div className="mt-4">
                <p className="text-sm font-semibold">Amostra Complementar Necessária:</p>
                <p className="text-3xl font-bold relative">
                  {complementarySampleSize > 0 ? complementarySampleSize : "N/A"}
                  {complementarySampleSize === MAX_COMPLEMENTARY_SAMPLE && <span className="absolute top-0 -right-2 text-xs bg-[#E71A3B] text-white font-bold px-2 py-1 rounded-full">TETO</span>}
                </p>

                {complementarySampleSize > 0 && !totalSampleExceedsLimit && (
                  <>
                    <div className="my-4">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Seed Complementar</label>
                       <input 
                         type="number" 
                         value={complementarySeed ?? ''} 
                         onChange={e => setComplementarySeed(e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                         className="w-full max-w-xs mx-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0033C6]" 
                         placeholder="Seed obrigatório"/>
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={complementarySeed === undefined}
                        className="mt-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Gerar Amostra Complementar ({complementarySampleSize} itens)
                    </button>
                  </>
                )}
                {totalSampleExceedsLimit && (
                    <p className="mt-2 p-2 bg-red-200 text-red-800 font-bold rounded">
                        Atenção! A amostra total ({totalSampleSize}) excede o limite de {MAX_TOTAL_SAMPLE}. Recomenda-se uma abordagem alternativa ou revisão dos parâmetros.
                    </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-bold rounded-lg shadow-md hover:bg-gray-700 transition-all duration-300">
          Voltar
        </button>
        <button onClick={onRestart} className="px-6 py-2 bg-[#0033C6] text-white font-bold rounded-lg shadow-md hover:bg-blue-800 transition-all duration-300">
          Iniciar Nova Amostragem
        </button>
      </div>
    </div>
  );
};

export default Step5_Test;