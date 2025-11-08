/**
 * Debug logging utility for UltraFeed
 * 
 * Set ULTRAFEED_DEBUG_ENABLED to true to enable debug logging.
 * Logs are written to tmp/ultrafeed-debug.log
 * For errors/warnings that should always be shown, use regular console.log/warn/error.
 */

import fs from 'fs';
import path from 'path';

export const ULTRAFEED_DEBUG_ENABLED = false;
const LOG_FILE_PATH = path.join(process.cwd(), 'tmp', 'ultrafeed-debug.log');

// Ensure tmp directory exists
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
    // Fallback to console if file writing fails
    // eslint-disable-next-line no-console
    console.error('[UltraFeed] Failed to write to log file:', error);
    // eslint-disable-next-line no-console
    console.log(`[UltraFeed] ${message}`, ...args);
  }
}

export const ultraFeedDebug = {
  log,
};

