/**
 * Registry for UltraFeed ranking algorithms.
 * 
 * Allows switching between different ranking implementations.
 */

import type { UltraFeedAlgorithm } from '../ultraFeedAlgorithmInterface';
import { scoringAlgorithm } from './scoringAlgorithm';
import { samplingAlgorithm } from './samplingAlgorithm';
import { ultraFeedAlgorithmABTest } from '@/lib/abTests';
import { getUserABTestGroup } from '@/lib/abTestImpl';
import type { UserOrClientId } from '@/components/ultraFeed/ultraFeedTypes';
import type { UltraFeedAlgorithmName } from '@/components/ultraFeed/ultraFeedSettingsTypes';

const algorithms: Record<UltraFeedAlgorithmName, UltraFeedAlgorithm> = {
  scoring: scoringAlgorithm,
  sampling: samplingAlgorithm,
};

export function getAlgorithm(
  name: UltraFeedAlgorithmName | 'auto' | undefined | null,
  userOrClientId: UserOrClientId | null,
  currentUser?: DbUser | null
): UltraFeedAlgorithm {
  if (!name || name === 'auto' || !algorithms[name as UltraFeedAlgorithmName]) {
    const abKeyInfo = userOrClientId?.type === 'user' && currentUser
      ? { user: currentUser }
      : { clientId: userOrClientId?.id };
    
    const abTestGroup = getUserABTestGroup(
      abKeyInfo,
      ultraFeedAlgorithmABTest
    );
    
    return algorithms[abTestGroup];
  }
  return algorithms[name];
}

export function getDefaultAlgorithm(): UltraFeedAlgorithm {
  return algorithms.sampling;
}

export function getAvailableAlgorithms(): UltraFeedAlgorithmName[] {
  return Object.keys(algorithms) as UltraFeedAlgorithmName[];
}

