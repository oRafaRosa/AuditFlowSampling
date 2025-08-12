
export enum AppStep {
  Parameters = 1,
  Upload = 2,
  Sampling = 3,
  Results = 4,
  Test = 5,
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
}

export type DataRow = Record<string, string | number>;

export enum SamplingMethod {
  None = "None",
  SimpleRandom = "Aleatória Simples",
  Systematic = "Sistemática",
  Stratified = "Estratificada",
  MonetaryUnit = "Unidade Monetária (MUS)",
}

export interface SampledItem extends DataRow {
  _originalIndex: number;
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
