"use client";
import React, { useState, useCallback } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { parseQueryLog } from './queryLogParser';
import QueryWaterfallChart from './QueryWaterfallChart';

const styles = defineStyles('QueryLogVisualizer', (theme) => ({
  container: {
    padding: 20,
    maxWidth: 1780,
    margin: '0 auto',
  },
  uploadSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    marginBottom: 20,
  },
  instructions: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.palette.grey[100],
    borderRadius: 4,
    fontSize: 14,
  },
  fileInput: {
    marginBottom: 20,
  },
  textareaContainer: {
    marginBottom: 20,
  },
  textarea: {
    width: '100%',
    height: 200,
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 12,
    border: `1px solid ${theme.palette.grey[400]}`,
    borderRadius: 4,
    resize: 'vertical',
  },
  button: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.background.paper,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.9,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  error: {
    padding: 16,
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
    borderRadius: 4,
    marginTop: 20,
  },
}));

// This was mostly vibe-coded, along with the waterfall chart component
export const QueryLogVisualizer = () => {
  const classes = useStyles(styles);
  const [logContent, setLogContent] = useState('');
  const [parsedData, setParsedData] = useState<ReturnType<typeof parseQueryLog> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setLogContent(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLogContent(event.target.value);
    setError(null);
  }, []);

  const handleParse = useCallback(() => {
    if (!logContent.trim()) {
      setError('Please provide log content');
      return;
    }

    try {
      const result = parseQueryLog(logContent);
      if (result.queries.length === 0) {
        setError('No queries found in the log. Make sure it contains "Running Postgres query" and "Finished query" lines.');
      } else {
        setParsedData(result);
        setError(null);
      }
    } catch (err) {
      setError(`Failed to parse log: ${err instanceof Error ? err.message : String(err)}`);
      setParsedData(null);
    }
  }, [logContent]);

  const handleClear = useCallback(() => {
    setLogContent('');
    setParsedData(null);
    setError(null);
  }, []);

  return (
    <div className={classes.container}>
      <div className={classes.uploadSection}>
        <h1 className={classes.title}>Query Log Waterfall Visualizer</h1>
        
        <div className={classes.instructions}>
          <strong>Instructions:</strong>
          <ul>
            <li>Upload a log file or paste log content below</li>
            <li>Log must contain "Running Postgres query #X:" and "Finished query #X" lines</li>
            <li>Route request logs (POST/GET) will be automatically ignored</li>
            <li>Click "Parse & Visualize" to generate the waterfall chart</li>
          </ul>
        </div>

        <div className={classes.fileInput}>
          <label>
            <strong>Upload Log File:</strong>
            <br />
            <input
              type="file"
              accept=".txt,.log"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        <div className={classes.textareaContainer}>
          <label>
            <strong>Or Paste Log Content:</strong>
            <br />
            <textarea
              className={classes.textarea}
              value={logContent}
              onChange={handleTextChange}
              placeholder="Paste your query log here..."
            />
          </label>
        </div>

        <button
          className={classes.button}
          onClick={handleParse}
          disabled={!logContent.trim()}
        >
          Parse & Visualize
        </button>
        {' '}
        <button
          className={classes.button}
          onClick={handleClear}
        >
          Clear
        </button>

        {error && (
          <div className={classes.error}>
            {error}
          </div>
        )}
      </div>

      {parsedData && (
        <QueryWaterfallChart
          queries={parsedData.queries}
          earliestTimestamp={parsedData.earliestTimestamp}
          latestTimestamp={parsedData.latestTimestamp}
        />
      )}
    </div>
  );
};

export default QueryLogVisualizer;

