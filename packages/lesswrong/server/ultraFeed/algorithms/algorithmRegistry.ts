/**
 * Registry for UltraFeed ranking algorithms.
 * 
 * Allows switching between different ranking implementations.
 */

import type { UltraFeedAlgorithm } from '../ultraFeedAlgorithmInterface';
import { scoringAlgorithm } from './scoringAlgorithm';
import { samplingAlgorithm } from './samplingAlgorithm';

export type UltraFeedAlgorithmName = 'scoring' | 'sampling';

const algorithms: Record<UltraFeedAlgorithmName, UltraFeedAlgorithm> = {
  scoring: scoringAlgorithm,
  sampling: samplingAlgorithm,
};

export function getAlgorithm(name: UltraFeedAlgorithmName | undefined | null): UltraFeedAlgorithm {
  if (!name || !algorithms[name]) {
    return algorithms.sampling;
  }
  return algorithms[name];
}

export function getDefaultAlgorithm(): UltraFeedAlgorithm {
  return algorithms.sampling;
}

export function getAvailableAlgorithms(): UltraFeedAlgorithmName[] {
  return Object.keys(algorithms) as UltraFeedAlgorithmName[];
}

