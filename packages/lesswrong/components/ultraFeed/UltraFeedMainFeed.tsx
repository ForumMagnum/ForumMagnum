import React, { useState, useCallback, useMemo } from 'react';
import { UltraFeedContextProvider } from './UltraFeedContextProvider';
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { UltraFeedQuery } from '../common/feeds/feedQueries';
import { createUltraFeedRenderers } from './renderers/createUltraFeedRenderers';
import type { UltraFeedSettingsType } from './ultraFeedSettingsTypes';
import type { FeedType } from './ultraFeedTypes';
import type { ObservableQuery, WatchQueryFetchPolicy } from '@apollo/client';
import { randomId } from '../../lib/random';
import { defineStyles, useStyles } from '../hooks/useStyles';
import {
  compareUltraFeedDebugResults,
  UltraFeedDebugHeader,
} from './UltraFeedDebugItem';
import type { UltraFeedDebugResult, UltraFeedDebugSortDirection, UltraFeedDebugSortField } from './UltraFeedDebugItem';

const styles = defineStyles("UltraFeedMainFeed", (theme: ThemeType) => ({
  emptyStateMessage: {
    ...theme.typography.commentStyle,
    color: theme.palette.error.main,
    fontSize: 18,
    textAlign: 'center',
    padding: 20,
  },
}));

type UltraFeedMainFeedProps = {
  settings: UltraFeedSettingsType;
  sessionId?: string;
  refetchRef?: {current: null | (() => void)},
  firstPageSize?: number;
  pageSize?: number;
  fetchPolicy?: WatchQueryFetchPolicy;
  loadMoreDistanceProp?: number;
  isActive?: boolean;
  debugMode?: boolean;
  feedType?: FeedType;
};

const UltraFeedMainFeed = ({
  settings,
  sessionId,
  refetchRef,
  firstPageSize = 15,
  pageSize = 30,
  fetchPolicy = 'cache-first',
  loadMoreDistanceProp,
  isActive = true,
  debugMode = false,
  feedType = "ultraFeed",
}: UltraFeedMainFeedProps) => {
  const classes = useStyles(styles);
  const [internalSessionId] = useState<string>(() => randomId());
  const actualSessionId = sessionId ?? internalSessionId;
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [debugSortField, setDebugSortField] = useState<UltraFeedDebugSortField>('score');
  const [debugSortDirection, setDebugSortDirection] = useState<UltraFeedDebugSortDirection>('desc');

  const handleLoadingStateChange = useCallback((results: Array<{type: string, [key: string]: unknown}>, loading: boolean) => {
    setShowEmptyState(!loading && results.length === 0);
  }, []);


  const variables = useMemo(() => ({
    sessionId: actualSessionId,
    settings: JSON.stringify({
      ...settings.resolverSettings,
      debugMode,
    }),
  }), [actualSessionId, settings, debugMode]);

  const renderers = useMemo(() => createUltraFeedRenderers({ settings, debugMode }), [settings, debugMode]);
  const debugHeader = useMemo(() => debugMode ? (
    <UltraFeedDebugHeader
      sortField={debugSortField}
      sortDirection={debugSortDirection}
      onSortChange={(field, direction) => {
        setDebugSortField(field);
        setDebugSortDirection(direction);
      }}
    />
  ) : undefined, [debugMode, debugSortField, debugSortDirection]);
  const debugSortResults = useMemo(() => debugMode
    ? (a: UltraFeedDebugResult, b: UltraFeedDebugResult) => compareUltraFeedDebugResults(a, b, debugSortField, debugSortDirection)
    : undefined,
    [debugMode, debugSortField, debugSortDirection]
  );

  return (
    <UltraFeedContextProvider feedType={feedType}>
      <MixedTypeFeed
        query={UltraFeedQuery}
        variables={variables}
        firstPageSize={firstPageSize}
        pageSize={pageSize}
        refetchRef={refetchRef}
        loadMoreDistanceProp={loadMoreDistanceProp}
        fetchPolicy={fetchPolicy}
        renderers={renderers}
        onLoadingStateChange={handleLoadingStateChange}
        pausePagination={!isActive}
        disableLoadMore={debugMode}
        header={debugHeader}
        sortResults={debugSortResults}
      />
      {showEmptyState && <div className={classes.emptyStateMessage}>Oh no! Something has gone wrong. There are no results to display.</div>}
    </UltraFeedContextProvider>
  );
};

export default UltraFeedMainFeed;


