'use client';

import React, { type JSX } from 'react';
import { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import type { LexicalEditor } from 'lexical';

import { gql } from '@/lib/generated/gql-codegen';
import { REVIEW_YEAR, reviewYears } from '@/lib/reviewUtils';
import { INSERT_REVIEW_RESULTS_COMMAND } from './ReviewResultsPlugin';
import LWDialog from '@/components/common/LWDialog';
import { DialogTitle } from '@/components/widgets/DialogTitle';
import { DialogContent } from '@/components/widgets/DialogContent';
import { DialogActions } from '@/components/widgets/DialogActions';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('InsertReviewResultsDialog', (theme: ThemeType) => ({
  paper: {
    width: 400,
  },
  error: {
    color: theme.palette.error.main,
    fontSize: 13,
    marginTop: 8,
  },
  loading: {
    fontSize: 13,
    color: theme.palette.grey[600],
    marginTop: 8,
  },
}));

const reviewResultsTableDataQuery = gql(`
  query GetReviewResultsTableData($year: Int!) {
    ReviewResultsTableData(year: $year) {
      year
      results {
        rank
        title
        postUrl
        authorName
        coauthorNames
        votes
      }
    }
  }
`);

interface InsertReviewResultsDialogProps {
  activeEditor: LexicalEditor;
  onClose: () => void;
}

export function InsertReviewResultsDialog({
  activeEditor,
  onClose,
}: InsertReviewResultsDialogProps): JSX.Element {
  const classes = useStyles(styles);
  const client = useApolloClient();
  const [yearStr, setYearStr] = useState(String(REVIEW_YEAR));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInsert = async () => {
    const year = parseInt(yearStr, 10);
    if (isNaN(year) || !reviewYears.has(year)) {
      setError('Please enter a valid year');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await client.query({
        query: reviewResultsTableDataQuery,
        variables: { year },
        fetchPolicy: 'network-only',
      });

      const tableData = data?.ReviewResultsTableData;
      if (!tableData || tableData.results.length === 0) {
        setError('No review results found for this year. Make sure vote totals have been computed.');
        setLoading(false);
        return;
      }

      activeEditor.dispatchCommand(INSERT_REVIEW_RESULTS_COMMAND, {
        year: tableData.year,
        results: tableData.results,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch review results');
      setLoading(false);
    }
  };

  return (
    <LWDialog open={true} onClose={onClose} maxWidth={false} paperClassName={classes.paper}>
      <DialogTitle>Insert Review Results Table</DialogTitle>
      <DialogContent>
        <TextField
          label="Review Year"
          value={yearStr}
          onChange={(e) => setYearStr(e.target.value)}
          type="number"
          fullWidth
          margin="dense"
          data-test-id="review-results-year-input"
        />
        {error && <div className={classes.error}>{error}</div>}
        {loading && <div className={classes.loading}>Fetching review results...</div>}
        <DialogActions>
          <Button
            color="primary"
            disabled={loading}
            onClick={handleInsert}
            data-test-id="review-results-insert-button"
          >
            {loading ? 'Loading...' : 'Insert'}
          </Button>
        </DialogActions>
      </DialogContent>
    </LWDialog>
  );
}
