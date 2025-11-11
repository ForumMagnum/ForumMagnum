/**
 * Debug logging utility for UltraFeed
 * 
 * Set ULTRAFEED_DEBUG_ENABLED to true to enable debug logging.
 * Logs are written to tmp/ultrafeed-debug.log
 * For errors/warnings that should always be shown, use regular console.log/warn/error.
 */

import fs from 'fs';
import path from 'path';
import { serverCaptureEvent } from '../analytics/serverAnalyticsWriter';

export const ULTRAFEED_DEBUG_ENABLED = false;
const LOG_FILE_PATH = path.join(process.cwd(), 'tmp', 'ultrafeed-debug.log');

function ensureLogDirectory(): void {
  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function log(message: string, ...args: any[]): void {
  if (!ULTRAFEED_DEBUG_ENABLED) {
    return;
  }

  try {
    ensureLogDirectory();
    
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 
      ? ' ' + args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      : '';
    
    const logEntry = `[${timestamp}] [UltraFeed] ${message}${formattedArgs}\n`;
    
    fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf8');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[UltraFeed] Failed to write to log file:', error);
    // eslint-disable-next-line no-console
    console.log(`[UltraFeed] ${message}`, ...args);
  }
}

export const ultraFeedDebug = {
  log,
};

export const logRankedItemsForAnalysis = async (
  rankedItemsWithMetadata: Array<{ id: string; metadata?: any }>,
  rankableItems: Array<any>,
  algorithmName: string,
  sessionId: string,
  currentUser: DbUser | null,
  clientId: string | undefined,
  offset: number
): Promise<void> => {
  if (!ULTRAFEED_DEBUG_ENABLED) return;
  
  const itemsForLogging = rankedItemsWithMetadata
    .filter((item): item is { id: string; metadata: any } => item.metadata !== undefined)
    .map(({ id, metadata }) => {
      const item = rankableItems.find((r: any) => r.id === id);
      return {
        itemId: id,
        itemType: item?.itemType ?? 'unknown',
        position: metadata.position,
        totalScore: metadata.scoreBreakdown.total,
        constraints: metadata.selectionConstraints.join(','),
        sources: item?.sources?.join(',') ?? '',
        repetitionPenaltyMultiplier: metadata.rankedItemType === 'commentThread'
          ? metadata.scoreBreakdown.repetitionPenaltyMultiplier
          : 1,
        scoreTerms: metadata.scoreBreakdown.terms,
      };
  });
  
  serverCaptureEvent('ultraFeedItemsRanked', {
    sessionId,
    userId: currentUser?._id ?? undefined,
    clientId: clientId ?? undefined,
    offset,
    itemCount: rankedItemsWithMetadata.length,
    algorithm: algorithmName,
    items: itemsForLogging,
  });
};

