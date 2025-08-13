import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Step1_Parameters from './components/Step1_Parameters';
import Step2_Upload from './components/Step2_Upload';
import Step3_Sampling from './components/Step3_Sampling';
import Step4_Results from './components/Step4_Results';
import Step5_Test from './components/Step5_Test';
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
};

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.Parameters);
  const [parameters, setParameters] = useState<AuditParameters>(initialParameters);
  const [sampleSizeA, setSampleSizeA] = useState<number>(0);
  const [originalData, setOriginalData] = useState<DataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampledData, setSampledData] = useState<SampledItem[]>([]);
  const [samplingMethod, setSamplingMethod] = useState<SamplingMethod>(SamplingMethod.None);
  const [samplingColumn, setSamplingColumn] = useState<string | undefined>();
  const [testResultInfo, setTestResultInfo] = useState<TestResultInfo | null>(null);

  const handleRestart = () => {
    const newSeed = Math.floor(Math.random() * 1000000);
    setStep(AppStep.Parameters);
    setParameters({...initialParameters, seed: newSeed});
    setSampleSizeA(0);
    setOriginalData([]);
    setHeaders([]);
    setSampledData([]);
    setSamplingMethod(SamplingMethod.None);
    setSamplingColumn(undefined);
    setTestResultInfo(null);
  };
  
  const handleParametersChange = (newParams: AuditParameters) => {
    setParameters(newParams);
  };

  const handleParametersNext = (calculatedSize: number) => {
    setSampleSizeA(calculatedSize);
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
    setSamplingMethod(method);
    setSamplingColumn(column);
    setSampledData(result);
    setTestResultInfo(null); // Clear previous test results
    setStep(AppStep.Results);
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
      case AppStep.Upload:
        return (
          <Step2_Upload 
            populationSize={parameters.populationSize}
            onUpload={handleUpload}
            onBack={() => setStep(AppStep.Parameters)}
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
                sampleSizeA={sampleSizeA}
                onNext={handleGoToTest}
                onBack={() => setStep(AppStep.Sampling)}
                testResultInfo={testResultInfo}
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
    <div className="min-h-screen bg-[#F0EFEA] flex flex-col items-center justify-start pt-28 pb-8 px-4 selection:bg-[#E71A3B] selection:text-white">
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
        <p>Versão 13082025.2</p>
      </footer>
    </div>
  );
}

export default App;
