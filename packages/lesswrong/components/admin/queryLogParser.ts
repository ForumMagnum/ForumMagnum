/**
 * Parser for Postgres query logs that extracts query start/end information
 * for visualization in a waterfall chart.
 */

export interface ParsedQuery {
  queryNumber: number;
  queryString: string;
  queryName: string | null;
  argumentCount: number | null;
  startTimestamp: number | null; // Will be calculated from finished timestamp - duration
  duration: number;
  finishedTimestamp: number;
  byteSize: number;
}

export interface ParseResult {
  queries: ParsedQuery[];
  earliestTimestamp: number;
  latestTimestamp: number;
}

interface RunningQuery {
  queryNumber: number;
  queryString: string;
  lineNumber: number;
}

interface FinishedQuery {
  queryNumber: number;
  duration: number;
  finishedTimestamp: number;
  byteSize: number;
  lineNumber: number;
}

/**
 * Extracts the query name from a query string using multiple strategies
 */
function extractQueryName(queryString: string): string | null {
  // Strategy 1: Extract from comment (e.g., "-- SequencesRepo.postsCount")
  const commentMatch = queryString.match(/--\s*([A-Za-z_][A-Za-z0-9_:.]+)/);
  if (commentMatch) {
    return commentMatch[1].trim();
  }

  // Strategy 2: Check if it's a function call format (e.g., "getLWKarmaChanges(...)")
  const functionMatch = queryString.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (functionMatch) {
    return functionMatch[1];
  }

  // Strategy 3: Extract table name from SELECT/INSERT/UPDATE/DELETE queries
  const selectMatch = queryString.match(/(?:SELECT|FROM)\s+["']?([A-Za-z_][A-Za-z0-9_]*)["']?\.\*/i);
  if (selectMatch) {
    return selectMatch[1];
  }

  const fromMatch = queryString.match(/FROM\s+["']([A-Za-z_][A-Za-z0-9_]*)["']/i);
  if (fromMatch) {
    return fromMatch[1];
  }

  const updateMatch = queryString.match(/UPDATE\s+["']?([A-Za-z_][A-Za-z0-9_]*)["']?/i);
  if (updateMatch) {
    return updateMatch[1];
  }

  const insertMatch = queryString.match(/INSERT\s+INTO\s+["']?([A-Za-z_][A-Za-z0-9_]*)["']?/i);
  if (insertMatch) {
    return insertMatch[1];
  }

  return null;
}

/**
 * Extracts the argument count from a query string
 */
function extractArgumentCount(queryString: string): number | null {
  // Strategy 1: Check if there's a parameter list after ":"
  const paramsMatch = queryString.match(/:\s*\[(.*)\]\s*$/s);
  if (paramsMatch) {
    const paramsContent = paramsMatch[1].trim();
    if (!paramsContent) return 0;
    
    // Handle nested arrays like [["id1","id2"]]
    if (paramsContent.startsWith('[') && paramsContent.endsWith(']')) {
      // This is a nested array - count as 1 argument
      return 1;
    }
    
    // Count top-level comma-separated values
    let depth = 0;
    let count = 1;
    for (let i = 0; i < paramsContent.length; i++) {
      const char = paramsContent[i];
      if (char === '[' || char === '{') depth++;
      if (char === ']' || char === '}') depth--;
      if (char === ',' && depth === 0) count++;
    }
    return count;
  }

  // Strategy 2: Count $N placeholders in the query
  const placeholders = queryString.match(/\$\d+/g);
  if (placeholders) {
    // Get the highest number
    const numbers = placeholders.map(p => parseInt(p.substring(1), 10));
    return Math.max(...numbers);
  }

  // Strategy 3: Function call with visible parameters
  const functionParamsMatch = queryString.match(/^[A-Za-z_][A-Za-z0-9_]*\s*\((.*)\)/s);
  if (functionParamsMatch) {
    const paramsContent = functionParamsMatch[1].trim();
    if (!paramsContent) return 0;
    
    // Count commas at depth 0
    let depth = 0;
    let count = 1;
    for (let i = 0; i < paramsContent.length; i++) {
      const char = paramsContent[i];
      if (char === '(' || char === '[' || char === '{') depth++;
      if (char === ')' || char === ']' || char === '}') depth--;
      if (char === ',' && depth === 0) count++;
    }
    return count;
  }

  return null;
}

/**
 * Parses a query log file and extracts structured query information.
 * 
 * @param logContent - The raw content of the log file
 * @returns ParseResult containing all parsed queries with timing information
 */
export function parseQueryLog(logContent: string): ParseResult {
  const lines = logContent.split('\n');
  const runningQueries = new Map<number, RunningQuery>();
  const finishedQueries = new Map<number, FinishedQuery>();
  const queries: ParsedQuery[] = [];

  let currentQuery: RunningQuery | null = null;
  let currentQueryLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip route request logs (e.g., "POST /graphql 200 in 759ms")
    if (line.match(/^\s*(GET|POST|PUT|DELETE|PATCH)\s+\//)) {
      continue;
    }

    // Check if this is a "Running Postgres query" line
    const runningMatch = line.match(/Running Postgres query #(\d+):\s*(.*)/);
    if (runningMatch) {
      // If we were building a previous query, save it
      if (currentQuery) {
        runningQueries.set(currentQuery.queryNumber, {
          ...currentQuery,
          queryString: currentQueryLines.join('\n').trim(),
        });
      }

      const queryNumber = parseInt(runningMatch[1], 10);
      const initialQueryText = runningMatch[2] || '';
      
      currentQuery = {
        queryNumber,
        queryString: initialQueryText,
        lineNumber: i,
      };
      currentQueryLines = initialQueryText ? [initialQueryText] : [];
      continue;
    }

    // Check if this is a "Finished query" line
    const finishedMatch = line.match(/Finished query #(\d+), undefined \((\d+) ms, (\d+)\) \((\d+)b?\)/);
    if (finishedMatch) {
      // Save any current query being built
      if (currentQuery) {
        runningQueries.set(currentQuery.queryNumber, {
          ...currentQuery,
          queryString: currentQueryLines.join('\n').trim(),
        });
        currentQuery = null;
        currentQueryLines = [];
      }

      const queryNumber = parseInt(finishedMatch[1], 10);
      const duration = parseInt(finishedMatch[2], 10);
      const finishedTimestamp = parseInt(finishedMatch[3], 10);
      const byteSize = parseInt(finishedMatch[4], 10);

      finishedQueries.set(queryNumber, {
        queryNumber,
        duration,
        finishedTimestamp,
        byteSize,
        lineNumber: i,
      });
      continue;
    }

    // If we're currently building a query string, add this line to it
    if (currentQuery) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        currentQueryLines.push(trimmedLine);
      }
    }
  }

  // Save the last query if we were building one
  if (currentQuery) {
    runningQueries.set(currentQuery.queryNumber, {
      ...currentQuery,
      queryString: currentQueryLines.join('\n').trim(),
    });
  }

  // Match running queries with finished queries
  let earliestTimestamp = Infinity;
  let latestTimestamp = -Infinity;

  for (const [queryNumber, finishedQuery] of finishedQueries) {
    const runningQuery = runningQueries.get(queryNumber);
    
    if (runningQuery) {
      const startTimestamp = finishedQuery.finishedTimestamp - finishedQuery.duration;
      const queryName = extractQueryName(runningQuery.queryString);
      const argumentCount = extractArgumentCount(runningQuery.queryString);
      
      queries.push({
        queryNumber,
        queryString: runningQuery.queryString,
        queryName,
        argumentCount,
        startTimestamp,
        duration: finishedQuery.duration,
        finishedTimestamp: finishedQuery.finishedTimestamp,
        byteSize: finishedQuery.byteSize,
      });

      earliestTimestamp = Math.min(earliestTimestamp, startTimestamp);
      latestTimestamp = Math.max(latestTimestamp, finishedQuery.finishedTimestamp);
    } else {
      // Query finished but never started in this log (might have started before logging began)
      // Calculate estimated start time anyway
      const startTimestamp = finishedQuery.finishedTimestamp - finishedQuery.duration;
      
      queries.push({
        queryNumber,
        queryString: '(Query start not found in log)',
        queryName: null,
        argumentCount: null,
        startTimestamp,
        duration: finishedQuery.duration,
        finishedTimestamp: finishedQuery.finishedTimestamp,
        byteSize: finishedQuery.byteSize,
      });

      earliestTimestamp = Math.min(earliestTimestamp, startTimestamp);
      latestTimestamp = Math.max(latestTimestamp, finishedQuery.finishedTimestamp);
    }
  }

  // Sort queries by start timestamp
  queries.sort((a, b) => (a.startTimestamp ?? 0) - (b.startTimestamp ?? 0));

  return {
    queries,
    earliestTimestamp: earliestTimestamp === Infinity ? 0 : earliestTimestamp,
    latestTimestamp: latestTimestamp === -Infinity ? 0 : latestTimestamp,
  };
}

/**
 * Formats byte size in a human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Formats duration in a human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

