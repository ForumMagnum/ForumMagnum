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

/**
 * Get an algorithm by name, defaulting to the scoring algorithm if not found.
 */
export function getAlgorithm(name: UltraFeedAlgorithmName | undefined | null): UltraFeedAlgorithm {
  if (!name || !algorithms[name]) {
    return algorithms.scoring; // Default to scoring algorithm
  }
  return algorithms[name];
}

/**
 * Get the default algorithm.
 */
export function getDefaultAlgorithm(): UltraFeedAlgorithm {
  return algorithms.sampling;
}

/**
 * Get all available algorithm names.
 */
export function getAvailableAlgorithms(): UltraFeedAlgorithmName[] {
  return Object.keys(algorithms) as UltraFeedAlgorithmName[];
}

