"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import type { ParsedQuery } from './queryLogParser';
import { formatBytes, formatDuration } from './queryLogParser';
import LWTooltip from '@/components/common/LWTooltip';

interface QueryBatch {
  batchId: number;
  queries: ParsedQuery[];
  startTimestamp: number;
  endTimestamp: number;
}

interface QueryOrBatch {
  type: 'query' | 'batch';
  query?: ParsedQuery;
  batch?: QueryBatch;
}

const styles = defineStyles('QueryWaterfallChart', (theme) => ({
  container: {
    padding: 20,
    backgroundColor: theme.palette.background.default,
    fontFamily: theme.typography.fontFamily,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 10,
  },
  stats: {
    fontSize: 14,
    color: theme.palette.grey[600],
  },
  controls: {
    marginTop: 10,
  },
  button: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.paper,
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    marginRight: 8,
    '&:hover': {
      opacity: 0.9,
    },
  },
  chartContainer: {
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: 4,
    padding: 20,
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '80vh',
  },
  timeline: {
    position: 'relative',
    minWidth: 800,
    paddingTop: 30,
  },
  timelineHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    borderBottom: `1px solid ${theme.palette.grey[300]}`,
  },
  timeMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeft: `1px solid ${theme.palette.grey[300]}`,
    fontSize: 11,
    color: theme.palette.grey[600],
    paddingLeft: 4,
  },
  queryRow: {
    position: 'relative',
    height: 30,
    marginBottom: 4,
  },
  batchRow: {
    position: 'relative',
    marginBottom: 4,
  },
  batchQueries: {
    marginBottom: 4,
  },
  queryBarWrapper: {
    position: 'absolute',
    height: 24,
  },
  queryBar: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingRight: 4,
    fontSize: 11,
    fontWeight: 500,
    color: theme.palette.background.paper,
    transition: 'all 0.2s ease',
    border: `1px solid ${theme.palette.greyAlpha(0.1)}`,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '&:hover': {
      transform: 'scaleY(1.2)',
      zIndex: 10,
      boxShadow: `0 2px 8px ${theme.palette.greyAlpha(0.15)}`,
    },
  },
  queryBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  queryBarNumber: {
    flexShrink: 0,
  },
  queryBarName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  queryBarRight: {
    flexShrink: 0,
  },
  batchBar: {
    height: '100%',
    width: '100%',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingRight: 4,
    fontSize: 11,
    fontWeight: 500,
    color: theme.palette.background.paper,
    backgroundColor: theme.palette.grey[500],
    border: `2px solid ${theme.palette.grey[700]}`,
    opacity: 0.7,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    '&:hover': {
      opacity: 0.9,
      transform: 'scaleY(1.1)',
      zIndex: 10,
      boxShadow: `0 2px 8px ${theme.palette.greyAlpha(0.15)}`,
    },
  },
  tooltipContent: {
    padding: 4,
  },
  tooltipTitle: {
    fontWeight: 600,
    marginBottom: 8,
    fontSize: 13,
  },
  tooltipInfo: {
    marginBottom: 4,
    fontSize: 12,
    display: 'flex',
    justifyContent: 'space-between',
    width: 120,
  },
  tooltipQuery: {
    fontFamily: 'monospace',
    fontSize: 11,
    maxHeight: 200,
    overflowY: 'auto',
    padding: 8,
    borderRadius: 2,
    marginTop: 8,
  },
  emptyState: {
    padding: 40,
    textAlign: 'center',
    color: theme.palette.grey[600],
  },
}));

interface QueryWaterfallChartProps {
  queries: ParsedQuery[];
  earliestTimestamp: number;
  latestTimestamp: number;
}

export const QueryWaterfallChart = ({
  queries,
  earliestTimestamp,
  latestTimestamp,
}: QueryWaterfallChartProps) => {
  const classes = useStyles(styles);
  const [expandedBatches, setExpandedBatches] = useState<Set<number>>(new Set());
  const [zoom, setZoom] = useState<number>(1);

  const totalDuration = latestTimestamp - earliestTimestamp;
  
  // Calculate width based on zoom level
  // At zoom=1, fit the entire timeline to ~1200px
  // At zoom=2, use 2x the space, etc.
  const baseWidth = 1600;
  const chartWidth = Math.max(800, baseWidth * zoom);

  // Detect batches of queries that were likely sent concurrently
  const queriesAndBatches = useMemo(() => {
    const BATCH_THRESHOLD_MS = 3;
    const MIN_BATCH_SIZE = 2;
    
    const items: QueryOrBatch[] = [];
    let currentBatch: ParsedQuery[] = [];
    let batchIdCounter = 0;
    
    const sortedQueries = [...queries].sort((a, b) => 
      (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0)
    );
    
    for (let i = 0; i < sortedQueries.length; i++) {
      const query = sortedQueries[i];
      
      if (currentBatch.length === 0) {
        currentBatch.push(query);
      } else {
        const lastQuery = currentBatch[currentBatch.length - 1];
        const timeDiff = (query.startTimestamp ?? 0) - (lastQuery.startTimestamp ?? 0);
        
        if (timeDiff <= BATCH_THRESHOLD_MS) {
          currentBatch.push(query);
        } else {
          if (currentBatch.length >= MIN_BATCH_SIZE) {
            const batchStart = currentBatch[0].startTimestamp ?? 0;
            const batchEnd = Math.max(...currentBatch.map(q => q.finishedTimestamp));
            items.push({
              type: 'batch',
              batch: {
                batchId: batchIdCounter++,
                queries: currentBatch,
                startTimestamp: batchStart,
                endTimestamp: batchEnd,
              },
            });
          } else {
            currentBatch.forEach(q => items.push({ type: 'query', query: q }));
          }
          
          currentBatch = [query];
        }
      }
    }
    
    if (currentBatch.length >= MIN_BATCH_SIZE) {
      const batchStart = currentBatch[0].startTimestamp ?? 0;
      const batchEnd = Math.max(...currentBatch.map(q => q.finishedTimestamp));
      items.push({
        type: 'batch',
        batch: {
          batchId: batchIdCounter++,
          queries: currentBatch,
          startTimestamp: batchStart,
          endTimestamp: batchEnd,
        },
      });
    } else {
      currentBatch.forEach(q => items.push({ type: 'query', query: q }));
    }
    
    return items;
  }, [queries]);

  const timeMarkers = useMemo(() => {
    if (totalDuration === 0) return [];
    
    const markers: number[] = [];
    let interval = 100;
    
    if (totalDuration > 10000) interval = 1000;
    else if (totalDuration > 5000) interval = 500;
    else if (totalDuration > 2000) interval = 200;
    
    for (let t = 0; t <= totalDuration; t += interval) {
      markers.push(t);
    }
    
    return markers;
  }, [totalDuration]);

  const getQueryColor = (queryNumber: number): string => {
    const hue = (queryNumber * 137.508) % 360; // Golden angle for good distribution
    return `hsl(${hue}, 70%, 50%)`;
  };

  const formatRelativeTime = (timestamp: number, padding?: number): string => {
    const offsetMs = timestamp - earliestTimestamp;
    const offsetSeconds = offsetMs / 1000;
    return `${padding ? ' '.repeat(padding) : ''}${offsetSeconds.toFixed(3)} seconds`;
  };

  const toggleBatch = (batchId: number) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allBatchIds = queriesAndBatches
      .filter(item => item.type === 'batch' && item.batch)
      .map(item => item.batch!.batchId);
    setExpandedBatches(new Set(allBatchIds));
  };

  const collapseAll = () => {
    setExpandedBatches(new Set());
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.5, 20));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5));
  const resetZoom = () => setZoom(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getTooltipContent = (query: ParsedQuery) => (
    <div className={classes.tooltipContent}>
      <div className={classes.tooltipTitle}>
        Query #{query.queryNumber}
        {query.queryName && `: ${query.queryName}`}
      </div>
      {query.argumentCount !== null && (
        <div className={classes.tooltipInfo}>
          <strong>Arguments:</strong> {query.argumentCount}
        </div>
      )}
      <div className={classes.tooltipInfo}>
        <strong>Duration:</strong> {formatDuration(query.duration)}
      </div>
      <div className={classes.tooltipInfo}>
        <strong>Start:</strong> {formatRelativeTime(query.startTimestamp ?? earliestTimestamp)}
      </div>
      <div className={classes.tooltipInfo}>
        <strong>End:</strong> {formatRelativeTime(query.finishedTimestamp, 4)}
      </div>
      <div className={classes.tooltipQuery}>
        {query.queryString}
      </div>
    </div>
  );

  const getBatchQueryNameSummary = (batch: QueryBatch): string => {
    const uniqueNames = new Set(
      batch.queries.map(q => q.queryName).filter((name): name is string => name !== null)
    );
    
    if (uniqueNames.size === 0) return '';
    if (uniqueNames.size === 1) return Array.from(uniqueNames)[0];
    if (uniqueNames.size === 2) return Array.from(uniqueNames).join(', ');
    return '~';
  };

  const getBatchTooltipContent = (batch: QueryBatch) => {
    const isExpanded = expandedBatches.has(batch.batchId);
    const queryNames = Array.from(new Set(
      batch.queries.map(q => q.queryName).filter((name): name is string => name !== null)
    ));
    
    return (
      <div className={classes.tooltipContent}>
        <div className={classes.tooltipTitle}>
          Batch of {batch.queries.length} queries
        </div>
        <div className={classes.tooltipInfo}>
          <strong>Queries:</strong> #{batch.queries[0].queryNumber} - #{batch.queries[batch.queries.length - 1].queryNumber}
        </div>
        {queryNames.length > 0 && (
          <div className={classes.tooltipInfo}>
            <strong>Query types:</strong> {queryNames.slice(0, 3).join(', ')}
            {queryNames.length > 3 && ` (+${queryNames.length - 3} more)`}
          </div>
        )}
        <div className={classes.tooltipInfo}>
          <strong>Start:</strong> {formatRelativeTime(batch.startTimestamp)}
        </div>
        <div className={classes.tooltipInfo}>
          <strong>End:</strong> {formatRelativeTime(batch.endTimestamp)}
        </div>
        <div className={classes.tooltipInfo}>
          <strong>Duration:</strong> {formatDuration(batch.endTimestamp - batch.startTimestamp)}
        </div>
        <div className={classes.tooltipInfo}>
          <strong>Total size:</strong> {formatBytes(batch.queries.reduce((sum, q) => sum + q.byteSize, 0))}
        </div>
        <div className={classes.tooltipInfo}>
          <em>Click to {isExpanded ? 'collapse' : 'expand'}</em>
        </div>
      </div>
    );
  };

  const renderQueryBar = (query: ParsedQuery) => {
    const startOffset = (query.startTimestamp ?? 0) - earliestTimestamp;
    const leftPercent = (startOffset / totalDuration) * 100;
    const widthPercent = (query.duration / totalDuration) * 100;

    return (
      <div key={query.queryNumber} className={classes.queryRow}>
        <div
          className={classes.queryBarWrapper}
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
          }}
        >
          <LWTooltip
            title={getTooltipContent(query)}
            placement="top"
            clickable
            inlineBlock={false}
            As="div"
          >
            <div
              className={classes.queryBar}
              style={{
                backgroundColor: getQueryColor(query.queryNumber),
              }}
            >
              <div className={classes.queryBarLeft}>
                <span className={classes.queryBarNumber}>#{query.queryNumber}</span>
                {query.queryName && (
                  <span className={classes.queryBarName}>{query.queryName}</span>
                )}
              </div>
              {query.argumentCount !== null && (
                <span className={classes.queryBarRight}>
                  ({query.argumentCount})
                </span>
              )}
            </div>
          </LWTooltip>
        </div>
      </div>
    );
  };

  if (queries.length === 0) {
    return (
      <div className={classes.container}>
        <div className={classes.emptyState}>
          No queries found in the log. Make sure the log contains "Running Postgres query" and "Finished query" lines.
        </div>
      </div>
    );
  }

  const batchCount = queriesAndBatches.filter(item => item.type === 'batch').length;
  const singleQueryCount = queriesAndBatches.filter(item => item.type === 'query').length;

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <div className={classes.title}>Query Waterfall Chart</div>
        <div className={classes.stats}>
          {queries.length} queries ({batchCount} batches, {singleQueryCount} individual) | 
          Total duration: {formatDuration(totalDuration)} | 
          Timespan: {earliestTimestamp} - {latestTimestamp} | 
          Zoom: {zoom.toFixed(1)}x (use +/- keys or buttons)
        </div>
        <div className={classes.controls}>
          {batchCount > 0 && (
            <>
              <button className={classes.button} onClick={expandAll}>
                Expand All Batches
              </button>
              <button className={classes.button} onClick={collapseAll}>
                Collapse All Batches
              </button>
              <span style={{ marginRight: 16 }} />
            </>
          )}
          <button className={classes.button} onClick={zoomOut}>
            Zoom Out (−)
          </button>
          <button className={classes.button} onClick={resetZoom}>
            Reset Zoom (0)
          </button>
          <button className={classes.button} onClick={zoomIn}>
            Zoom In (+)
          </button>
        </div>
      </div>

      <div className={classes.chartContainer}>
        <div className={classes.timeline} style={{ width: chartWidth }}>
          {/* Time markers header */}
          <div className={classes.timelineHeader}>
            {timeMarkers.map((timeOffset) => {
              const position = (timeOffset / totalDuration) * 100;
              return (
                <div
                  key={timeOffset}
                  className={classes.timeMarker}
                  style={{ left: `${position}%` }}
                >
                  {formatDuration(timeOffset)}
                </div>
              );
            })}
          </div>

          {queriesAndBatches.map((item, idx) => {
            if (item.type === 'query' && item.query) {
              return renderQueryBar(item.query);
            } else if (item.type === 'batch' && item.batch) {
              const batch = item.batch;
              const isExpanded = expandedBatches.has(batch.batchId);
              const startOffset = batch.startTimestamp - earliestTimestamp;
              const leftPercent = (startOffset / totalDuration) * 100;
              const widthPercent = ((batch.endTimestamp - batch.startTimestamp) / totalDuration) * 100;

              const batchQueryNameSummary = getBatchQueryNameSummary(batch);

              return (
                <div key={`batch-${batch.batchId}`} className={classes.batchRow}>
                  <div className={classes.queryRow}>
                    <div
                      className={classes.queryBarWrapper}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <LWTooltip
                        title={getBatchTooltipContent(batch)}
                        placement="top"
                        clickable
                        inlineBlock={false}
                        As="div"
                      >
                        <div 
                          className={classes.batchBar}
                          onClick={() => toggleBatch(batch.batchId)}
                        >
                          <div className={classes.queryBarLeft}>
                            <span>{isExpanded ? '▼' : '▶'}</span>
                            <span>{batch.queries.length}×</span>
                            {batchQueryNameSummary && (
                              <span className={classes.queryBarName}>{batchQueryNameSummary}</span>
                            )}
                          </div>
                          <span className={classes.queryBarRight}>
                            #{batch.queries[0].queryNumber}-{batch.queries[batch.queries.length - 1].queryNumber}
                          </span>
                        </div>
                      </LWTooltip>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={classes.batchQueries}>
                      {batch.queries.map(query => renderQueryBar(query))}
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};

export default QueryWaterfallChart;

