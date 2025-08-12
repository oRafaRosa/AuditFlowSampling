
import type { DataRow, SampledItem } from '../types';

// Seedable pseudo-random number generator (PRNG) using LCG algorithm.
// Returns a function that generates numbers between 0 (inclusive) and 1 (exclusive).
const createRNG = (seed: number) => {
  let currentSeed = seed;
  return () => {
    // LCG parameters used by GCC
    currentSeed = (currentSeed * 1664525 + 1013904223) % 2**32;
    return currentSeed / 2**32;
  };
};


// Fisher-Yates shuffle algorithm using a seeded RNG
const shuffleArray = <T,>(array: T[], rng: () => number): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper to get items that are not in the exclusion set
const getAvailableItems = (data: DataRow[], excludeIndices: Set<number>): SampledItem[] => {
  return data
    .map((row, index) => ({ ...row, _originalIndex: index }))
    .filter(item => !excludeIndices.has(item._originalIndex));
};

export const performSimpleRandomSampling = (
  data: DataRow[], 
  sampleSize: number, 
  seed: number,
  excludeIndices: Set<number> = new Set()
): SampledItem[] => {
  const rng = createRNG(seed);
  const availableItems = getAvailableItems(data, excludeIndices);
  return shuffleArray(availableItems, rng).slice(0, sampleSize);
};

export const performSystematicSampling = (
  data: DataRow[], 
  sampleSize: number, 
  seed: number,
  excludeIndices: Set<number> = new Set()
): SampledItem[] => {
  const rng = createRNG(seed);
  const availableItems = getAvailableItems(data, excludeIndices);
  const populationSize = availableItems.length;
  if (sampleSize === 0 || populationSize === 0) return [];
  if (sampleSize >= populationSize) return availableItems;
  
  const k = Math.floor(populationSize / sampleSize);
  const interval = k < 1 ? 1 : k;

  const start = Math.floor(rng() * interval);
  const sample: SampledItem[] = [];

  for (let i = start; i < populationSize && sample.length < sampleSize; i += interval) {
    sample.push(availableItems[i]);
  }
  return sample;
};

export const performStratifiedSampling = (
  data: DataRow[], 
  sampleSize: number, 
  stratumColumn: string, 
  seed: number,
  excludeIndices: Set<number> = new Set()
): SampledItem[] => {
  const rng = createRNG(seed);
  const availableItems = getAvailableItems(data, excludeIndices);
  const populationSize = availableItems.length;
  if (populationSize === 0 || sampleSize === 0) return [];

  const strata: Record<string, SampledItem[]> = {};

  availableItems.forEach(item => {
    const stratumValue = String(item[stratumColumn]);
    if (!strata[stratumValue]) {
      strata[stratumValue] = [];
    }
    strata[stratumValue].push(item);
  });

  let finalSample: SampledItem[] = [];
  const sampledIndices = new Set<number>();

  Object.values(strata).forEach(stratumData => {
    const proportion = stratumData.length / populationSize;
    const stratumSampleSize = Math.round(proportion * sampleSize);
    
    const sampledItems = shuffleArray(stratumData, rng).slice(0, stratumSampleSize);
    sampledItems.forEach(item => {
        finalSample.push(item);
        sampledIndices.add(item._originalIndex);
    });
  });

  // Adjust for rounding errors to meet the exact sample size
  const needed = sampleSize - finalSample.length;
  if (needed > 0) {
    let remainingPool = availableItems.filter(item => !sampledIndices.has(item._originalIndex));
    finalSample.push(...shuffleArray(remainingPool, rng).slice(0, needed));
  } else if (needed < 0) {
    finalSample = shuffleArray(finalSample, rng).slice(0, sampleSize);
  }

  return finalSample;
};

export const performMonetaryUnitSampling = (
  data: DataRow[], 
  sampleSize: number, 
  valueColumn: string,
  seed: number,
  excludeIndices: Set<number> = new Set()
): SampledItem[] => {
  const rng = createRNG(seed);
  const availableItems = getAvailableItems(data, excludeIndices);
  if (availableItems.length === 0 || sampleSize === 0) return [];
  if (sampleSize >= availableItems.length) return availableItems;

  const totalValue = availableItems.reduce((sum, row) => sum + Number(row[valueColumn] || 0), 0);
  if (totalValue === 0) return [];

  const samplingInterval = totalValue / sampleSize;
  let startPoint = rng() * samplingInterval;
  
  const selectionPoints = Array.from({ length: sampleSize }, (_, i) => startPoint + (i * samplingInterval));
  
  const sample: SampledItem[] = [];
  const selectedIndices = new Set<number>();
  let cumulativeValue = 0;

  availableItems.forEach((item) => {
    const value = Number(item[valueColumn] || 0);
    const prevCumulativeValue = cumulativeValue;
    cumulativeValue += value;

    selectionPoints.forEach(point => {
      if (point > prevCumulativeValue && point <= cumulativeValue && !selectedIndices.has(item._originalIndex)) {
        sample.push(item);
        selectedIndices.add(item._originalIndex);
      }
    });
  });

  // Fill remainder if MUS selects fewer items than requested
  if (sample.length < sampleSize) {
      const remainingItems = availableItems
          .filter(item => !selectedIndices.has(item._originalIndex));
      
      const needed = sampleSize - sample.length;
      sample.push(...shuffleArray(remainingItems, rng).slice(0, needed));
  }

  return shuffleArray(sample, rng).slice(0, sampleSize);
};
