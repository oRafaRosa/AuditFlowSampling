import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import { Step1_Parameters } from './components/Step1_Parameters';
import Step1_5_Target from './components/Step1_5_Target';
import Step2_Upload from './components/Step2_Upload';
import Step3_Sampling from './components/Step3_Sampling';
import Step4_Results from './components/Step4_Results';
import Step5_Test from './components/Step5_Test';
import ManualModal from './components/ManualModal';
import { AppStep, SamplingMethod, QualitativeImpact } from './types';
import type { AuditParameters, DataRow, SampledItem, TestResultInfo } from './types';
import {
  performSimpleRandomSampling,
  performSystematicSampling,
  performStratifiedSampling,
  performMonetaryUnitSampling
} from './services/samplingService';

const initialParameters: AuditParameters = {
  populationSize: 0,
  isFinancial: false,
  totalValue: 0,
  confidenceLevel: 2,
  processRisk: 2,
  controlsMaturity: 2,
  tolerableError: 5,
  minMonetaryValue: 0,
  seed: Math.floor(Math.random() * 1000000),
  dataExtractionInfo: '',
  hasTargetSelection: false,
  targetSelectionCount: 0,
  targetSelectionValue: 0,
  targetSelectionRationale: '',
};

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.Parameters);
  const [parameters, setParameters] = useState<AuditParameters>(initialParameters);
  const [initialSampleSize, setInitialSampleSize] = useState<number>(0);
  const [sampleSizeA, setSampleSizeA] = useState<number>(0);
  const [originalData, setOriginalData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampledData, setSampledData] = useState<SampledItem[]>([]);
  const [samplingMethod, setSamplingMethod] = useState<SamplingMethod>(SamplingMethod.None);
  const [samplingColumn, setSamplingColumn] = useState<string | undefined>();
  const [testResultInfo, setTestResultInfo] = useState<TestResultInfo | null>(null);
  const [replacementInfo, setReplacementInfo] = useState<{ seed: number; replacedCount: number } | null>(null);
  const [isManualOpen, setIsManualOpen] = useState(false);

  const handleRestart = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setStep(AppStep.Parameters);
    setParameters({...initialParameters, seed: newSeed});
    setInitialSampleSize(0);
    setSampleSizeA(0);
    setOriginalData([]);
    setHeaders([]);
    setSampledData([]);
    setSamplingMethod(SamplingMethod.None);
    setSamplingColumn(undefined);
    setTestResultInfo(null);
    setReplacementInfo(null);
  };
  
  const handleParametersChange = (newParams: AuditParameters) => {
    setParameters(newParams);
  };

  const handleParametersNext = (calculatedSize: number) => {
    setInitialSampleSize(calculatedSize);
    setSampleSizeA(calculatedSize); // This is now the base size, to be adjusted
    setStep(AppStep.TargetSelection);
  };

  const handleTargetSelectionNext = () => {
    const finalSampleSize = Math.max(0, initialSampleSize - (parameters.hasTargetSelection ? parameters.targetSelectionCount : 0));
    setSampleSizeA(finalSampleSize);
    setStep(AppStep.Upload);
  };
  
  const handleUpload = useCallback((data: DataRow[], fileHeaders: string[]) => {
    setOriginalData(data);
    setHeaders(fileHeaders);
  }, []);

  const handleSelectSamplingMethod = (method: SamplingMethod, column?: string) => {
    let result: SampledItem[] = [];
    const dataToSample = originalData;
    const seed = parameters.seed;
    
    // sampleSizeA is now the adjusted size
    if (sampleSizeA > 0) {
    
    switch (method) {
      case SamplingMethod.SimpleRandom:
        result = performSimpleRandomSampling(dataToSample, sampleSizeA, seed);
        break;
      case SamplingMethod.Systematic:
        result = performSystematicSampling(dataToSample, sampleSizeA, seed);
        break;
      case SamplingMethod.Stratified:
        if (column) {
          result = performStratifiedSampling(dataToSample, sampleSizeA, column, seed);
        }
        break;
      case SamplingMethod.MonetaryUnit:
        if (column) {
          result = performMonetaryUnitSampling(dataToSample, sampleSizeA, column, seed);
        }
        break;
      }
    }
    setSamplingMethod(method);
    setSamplingColumn(column);
    setSampledData(result);
    setTestResultInfo(null);
    setReplacementInfo(null);
    setStep(AppStep.Results);
  };

  const handleReplaceItems = (indicesToReplace: number[], newSeed: number) => {
      const count = indicesToReplace.length;
      if (count === 0) return;

      const existingIndices = new Set(sampledData.map(item => item._originalIndex));
      
      let newItems: SampledItem[] = [];
      
      switch (samplingMethod) {
          case SamplingMethod.SimpleRandom:
              newItems = performSimpleRandomSampling(originalData, count, newSeed, existingIndices);
              break;
          case SamplingMethod.Systematic:
              newItems = performSystematicSampling(originalData, count, newSeed, existingIndices);
              break;
          case SamplingMethod.Stratified:
              if (samplingColumn) {
                  newItems = performStratifiedSampling(originalData, count, samplingColumn, newSeed, existingIndices);
              }
              break;
          case SamplingMethod.MonetaryUnit:
              if (samplingColumn) {
                  newItems = performMonetaryUnitSampling(originalData, count, samplingColumn, newSeed, existingIndices);
              }
              break;
      }

      const newItemsWithFlag = newItems.map(item => ({...item, _isReplacement: true }));
      const updatedSample = sampledData.filter(item => !indicesToReplace.includes(item._originalIndex));
      
      setSampledData([...updatedSample, ...newItemsWithFlag]);
      setReplacementInfo({ seed: newSeed, replacedCount: count });
  };

  const handleGenerateComplementarySample = (complementarySize: number, errorsFound: number, qualitativeImpact: QualitativeImpact, rationale: string, complementarySeed: number) => {
    const existingIndices = new Set(sampledData.map(item => item._originalIndex));
    const seedToUse = complementarySeed;
    let newSample: SampledItem[] = [];

    switch (samplingMethod) {
      case SamplingMethod.SimpleRandom:
        newSample = performSimpleRandomSampling(originalData, complementarySize, seedToUse, existingIndices);
        break;
      case SamplingMethod.Systematic:
        newSample = performSystematicSampling(originalData, complementarySize, seedToUse, existingIndices);
        break;
      case SamplingMethod.Stratified:
        if (samplingColumn) {
          newSample = performStratifiedSampling(originalData, complementarySize, samplingColumn, seedToUse, existingIndices);
        }
        break;
      case SamplingMethod.MonetaryUnit:
         if (samplingColumn) {
          newSample = performMonetaryUnitSampling(originalData, complementarySize, samplingColumn, seedToUse, existingIndices);
        }
        break;
    }
    
    setTestResultInfo({ 
        errorsFound, 
        complementarySampleSize: complementarySize, 
        qualitativeImpact, 
        rationale,
        complementarySeed
    });
    setSampledData(prev => [...prev, ...newSample]);
    setStep(AppStep.Results);
  };
  
  const handleGoToTest = () => {
    // Reset test info only when going to test, to keep it for the report
    // setTestResultInfo(null); 
    setStep(AppStep.Test);
  };

  const renderStep = () => {
    switch (step) {
      case AppStep.Parameters:
        return (
          <Step1_Parameters 
            parameters={parameters}
            onParametersChange={handleParametersChange}
            onNext={handleParametersNext} 
          />
        );
            case AppStep.TargetSelection:
        return (
          <Step1_5_Target
            parameters={parameters}
            onParametersChange={handleParametersChange}
            onBack={() => setStep(AppStep.Parameters)}
            onNext={handleTargetSelectionNext}
          />
        );
      case AppStep.Upload:
        return (
          <Step2_Upload 
            populationSize={parameters.populationSize}
            onUpload={handleUpload}
            onBack={() => setStep(AppStep.TargetSelection)}
            onNext={() => setStep(AppStep.Sampling)}
            dataExtractionInfo={parameters.dataExtractionInfo}
            onDataExtractionInfoChange={(info) => setParameters(p => ({...p, dataExtractionInfo: info}))}
          />
        );
      case AppStep.Sampling:
        return (
          <Step3_Sampling
            onSelectMethod={handleSelectSamplingMethod}
            onBack={() => setStep(AppStep.Upload)}
            headers={headers}
            isFinancial={parameters.isFinancial}
            seed={parameters.seed}
            onSeedChange={(seed) => setParameters(p => ({...p, seed}))}
          />
        );
      case AppStep.Results:
        return (
            <Step4_Results 
                sampledData={sampledData}
                samplingMethod={samplingMethod}
                parameters={parameters}
                initialSampleSize={initialSampleSize}
                sampleSizeA={sampleSizeA}
                onNext={handleGoToTest}
                onBack={() => setStep(AppStep.Sampling)}
                testResultInfo={testResultInfo}
                replacementInfo={replacementInfo}
                onReplaceItems={handleReplaceItems}
            />
        );
      case AppStep.Test:
        return (
            <Step5_Test
                parameters={parameters}
                initialSampledDataCount={sampleSizeA}
                onRestart={handleRestart}
                onBack={() => setStep(AppStep.Results)}
                onGenerateComplementarySample={handleGenerateComplementarySample}
            />
        );
      default:
        return <h1 className="text-red-500">Erro: Etapa desconhecida.</h1>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EFEA] flex flex-col items-center justify-start pt-10 pb-8 px-4 selection:bg-[#E71A3B] selection:text-white">
      <Header />
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[#0033C6]">AuditFlow Sampling</h1>
        <p className="text-lg text-gray-600 mt-2">Módulo oficial de seleção de amostras</p>
      </header>
      <main className="w-full flex items-center justify-center">
        {renderStep()}
      </main>
      <footer className="text-center mt-8 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} AuditFlow. Todos os direitos reservados.</p>
        <p>Versão 20082025.3</p>
      </footer>
       <button
          onClick={() => setIsManualOpen(true)}
          className="fixed bottom-6 right-6 bg-[#0033C6] text-white p-4 rounded-full shadow-lg hover:bg-blue-800 transition-transform transform hover:scale-110 z-30"
          aria-label="Abrir manual do aplicativo"
          title="Manual do Aplicativo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      <ManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />      
    </div>
  );
}

export default App;