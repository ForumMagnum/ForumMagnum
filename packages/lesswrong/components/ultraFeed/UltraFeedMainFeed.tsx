import React, { useState } from 'react';
import { UltraFeedContextProvider } from './UltraFeedContextProvider';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { UltraFeedQuery } from '../common/feeds/feedQueries';
import { createUltraFeedRenderers } from './renderers/createUltraFeedRenderers';
import type { UltraFeedSettingsType } from './ultraFeedSettingsTypes';
import type { ObservableQuery, WatchQueryFetchPolicy } from '@apollo/client';
import { randomId } from '../../lib/random';

type UltraFeedMainFeedProps = {
  settings: UltraFeedSettingsType;
  sessionId?: string;
  refetchRef?: {current: null | (() => void)},
  firstPageSize?: number;
  pageSize?: number;
  fetchPolicy?: WatchQueryFetchPolicy;
  loadMoreDistanceProp?: number;
};

const UltraFeedMainFeed = ({
  settings,
  sessionId,
  refetchRef,
  firstPageSize = 15,
  pageSize = 30,
  fetchPolicy = 'cache-first',
  loadMoreDistanceProp,
}: UltraFeedMainFeedProps) => {
  const [internalSessionId] = useState<string>(() => randomId());
  const actualSessionId = sessionId ?? internalSessionId;

  return (
    <UltraFeedContextProvider feedType="ultraFeed">
      <MixedTypeFeed
        query={UltraFeedQuery}
        variables={{
          sessionId: actualSessionId,
          settings: JSON.stringify(settings.resolverSettings),
        }}
        firstPageSize={firstPageSize}
        pageSize={pageSize}
        refetchRef={refetchRef}
        loadMoreDistanceProp={loadMoreDistanceProp}
        fetchPolicy={fetchPolicy}
        renderers={createUltraFeedRenderers({ settings })}
      />
    </UltraFeedContextProvider>
  );
};

export default UltraFeedMainFeed;


