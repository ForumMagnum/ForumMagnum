'use client';

import React, { useState } from 'react';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import Loading from '../vulcan-core/Loading';
import CommentsNode from '../comments/CommentsNode';
import { Typography } from '../common/Typography';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import type { ErrorLike } from '@apollo/client';
import { isNotRandomId } from '@/lib/random';

const COMMENT_EMBEDDINGS_SEARCH_QUERY = gql(`
  query CommentEmbeddingsSearchQuery($query: String!, $scoreBias: Float) {
    CommentEmbeddingSearch(query: $query, scoreBias: $scoreBias) {
      ...CommentsListWithParentMetadata
    }
  }
`);

const COMMENT_EMBEDDINGS_SIMILARITY_SEARCH_QUERY = gql(`
  query CommentEmbeddingsSimilaritySearchQuery($commentId: String!, $scoreBias: Float) {
    CommentEmbeddingSimilaritySearch(commentId: $commentId, scoreBias: $scoreBias) {
      ...CommentsListWithParentMetadata
    }
  }
`);

const styles = defineStyles("CommentEmbeddingsPage", (theme: ThemeType) => ({ 
  searchContainer: {
    marginBottom: theme.spacing.unit * 3,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.unit * 2,
  },
  searchRow: {
    display: 'flex',
    gap: theme.spacing.unit * 2,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    minWidth: 300,
  },
  scoreBiasInput: {
    width: 75,
  },
  searchButton: {
    height: 36,
  },
  resultsContainer: {
    marginTop: theme.spacing.unit
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing.unit * 4,
  },
  errorMessage: {
    color: theme.palette.error.main,
    marginBottom: theme.spacing.unit * 2,
  },
  noResultsMessage: {
    padding: theme.spacing.unit * 4,
    textAlign: 'center',
    color: theme.palette.grey[600],
  },
  commentWrapper: {
    marginBottom: theme.spacing.unit * 2,
  },
  title: {
    flexGrow: 1,
    ...theme.typography.body2,
    fontSize: '1.5rem',
  },
  helpText: {
    color: theme.palette.grey[600],
  },
  resultCount: {
    marginBottom: theme.spacing.unit * 2,
  },
  outlinedLabel: {
    backgroundColor: theme.palette.background.default,
    paddingLeft: 4,
    paddingRight: 4,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.unit
  },
}));

interface SearchResultsProps {
  comments: Array<CommentsListWithParentMetadata>;
  loading: boolean;
  error?: ErrorLike | null;
  hasSearched: boolean;
  noResultsMessage: string;
}

const SearchResults = ({
  comments,
  loading,
  error,
  hasSearched,
  noResultsMessage,
}: SearchResultsProps) => {
  const classes = useStyles(styles);
  
  return (
    <div className={classes.resultsContainer}>
      {error && (
        <Typography variant="body1" className={classes.errorMessage}>
          Error: {error.message}
        </Typography>
      )}

      {loading && (
        <div className={classes.loadingContainer}>
          <Loading />
        </div>
      )}

      {!loading && hasSearched && comments.length === 0 && (
        <div className={classes.noResultsMessage}>
          <Typography variant="body2">
            {noResultsMessage}
          </Typography>
        </div>
      )}

      {!loading && comments.length > 0 && (
        <div>
          <Typography variant="body2" className={classes.resultCount}>
            Found {comments.length} result{comments.length !== 1 ? 's' : ''}
          </Typography>
          {comments.map(comment => (
            <div key={comment._id} className={classes.commentWrapper}>
              <CommentsNode
                treeOptions={{
                  condensed: false,
                  post: comment.post ?? undefined,
                  tag: comment.tag ?? undefined,
                  showPostTitle: true,
                  forceNotSingleLine: true,
                }}
                comment={comment}
                startThreadTruncated={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CommentEmbeddingsPage = ({externalSearchQuery}: {externalSearchQuery?: string}) => {
  const classes = useStyles(styles);

  const currentUser = useCurrentUser();
  
  const [karmaBias, setScoreBias] = useState<number>(0);
  const [executeSearch, setExecuteSearch] = useState(false);
  const [searchVariables, setSearchVariables] = useState<{ query: string; scoreBias: number } | null>(null);
  const [executeSimilaritySearch, setExecuteSimilaritySearch] = useState(false);
  const [similaritySearchVariables, setSimilaritySearchVariables] = useState<{ commentId: string; scoreBias: number } | null>(null);

  // Text search query
  const { data, loading, error } = useQuery(COMMENT_EMBEDDINGS_SEARCH_QUERY, {
    variables: searchVariables ?? { query: '', scoreBias: 0 },
    skip: !executeSearch,
  });

  // Similarity search query
  const { data: similarityData, loading: similarityLoading, error: similarityError } = useQuery(COMMENT_EMBEDDINGS_SIMILARITY_SEARCH_QUERY, {
    variables: similaritySearchVariables ?? { commentId: '', scoreBias: 0 },
    skip: !executeSimilaritySearch,
  });

  React.useEffect(() => {
    if (externalSearchQuery && externalSearchQuery.trim()) {
      const isRandomId = !isNotRandomId(externalSearchQuery.trim());
      // Check if the external search query looks like a random ID
      if (isRandomId) {
        // If it's a random ID, use similarity search instead
        setSimilaritySearchVariables({ commentId: externalSearchQuery.trim(), scoreBias: karmaBias });
        setExecuteSimilaritySearch(true);
        setExecuteSearch(false);
      } else {
        // Otherwise, use text search
        setSearchVariables({ query: externalSearchQuery, scoreBias: karmaBias });
        setExecuteSearch(true);
        setExecuteSimilaritySearch(false);
      }
    }
  }, [externalSearchQuery, karmaBias]);

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied explanation='You must be an admin to search comments by embedding' />;
  }

  const comments = data?.CommentEmbeddingSearch ?? [];
  const similarComments = similarityData?.CommentEmbeddingSimilaritySearch ?? [];
  const displayComments = executeSearch ? comments : similarComments;
  const displayLoading = executeSearch ? loading : similarityLoading;
  const displayError = executeSearch ? error : similarityError;
  const hasSearched = executeSearch || executeSimilaritySearch;

  return (
    <div>
      <div className={classes.title}>
        Comment Embeddings Results
      </div>
      <div className={classes.header}>
        <Typography variant="body2" className={classes.helpText}>
          Search for comments using semantic similarity, or enter a comment ID to find similar comments.
        </Typography> 
        <TextField
          className={classes.scoreBiasInput}
          label="Karma Bias"
          type="number"
          value={karmaBias}
          onChange={(e) => setScoreBias(parseFloat(e.target.value) || 0)}
          variant="outlined"
          InputLabelProps={{
            className: classes.outlinedLabel,
          }}
        />
      </div>


      <SearchResults
        comments={displayComments}
        loading={displayLoading}
        error={displayError}
        hasSearched={hasSearched}
        noResultsMessage="No comments found for your search."
      />
    </div>
  )
}

export default CommentEmbeddingsPage;
