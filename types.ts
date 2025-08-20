export enum AppStep {
  Parameters = 1,
  TargetSelection = 2,
  Upload = 3,
  Sampling = 4,
  Results = 5,
  Test = 6,
}

export interface AuditParameters {
  populationSize: number;
  isFinancial: boolean;
  totalValue: number;
  confidenceLevel: number; // 1, 2, or 3
  processRisk: number; // 1 to 4
  controlsMaturity: number; // 1 to 3
  tolerableError: number; // as percentage (e.g., 5 for 5%)
  minMonetaryValue: number;
  seed: number;
  dataExtractionInfo: string;
  hasTargetSelection: boolean;
  targetSelectionCount: number;
  targetSelectionValue: number;
  targetSelectionRationale: string;
}

export type DataRow = Record<string, string | number | boolean>;

export enum SamplingMethod {
  None = "None",
  SimpleRandom = "Aleatória Simples",
  Systematic = "Sistemática",
  Stratified = "Estratificada",
  MonetaryUnit = "Unidade Monetária (MUS)",
}

export interface SampledItem extends DataRow {
  _originalIndex: number;
  _isReplacement?: boolean;
}

export enum QualitativeImpact {
    None = "",
    Low = "Pouco relevante",
    Medium = "Relevante",
    High = "Muito relevante",
}

export interface TestResultInfo {
    errorsFound: number;
    complementarySampleSize: number;
    qualitativeImpact: QualitativeImpact;
    rationale: string;
    complementarySeed?: number;
}