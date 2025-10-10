'use client';

import React, { useState } from 'react';
import { useStyles, defineStyles } from '@/components/hooks/useStyles';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
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
  root: {
    maxWidth: 720,
    margin: '0 auto',
    width: '100%',
  },
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
    width: 150,
  },
  searchButton: {
    height: 36,
  },
  resultsContainer: {
    marginTop: theme.spacing.unit * 3,
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
    marginBottom: theme.spacing.unit * 3,
  },
  helpText: {
    color: theme.palette.grey[600],
    fontSize: '0.875rem',
  },
  resultCount: {
    marginBottom: theme.spacing.unit * 2,
  },
  outlinedLabel: {
    backgroundColor: theme.palette.background.default,
    paddingLeft: 4,
    paddingRight: 4,
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

interface CommentEmbeddingsPageProps {
  externalSearchQuery?: string;
  hideTitle?: boolean;
  hideSearchInput?: boolean;
}

const CommentEmbeddingsPage = ({externalSearchQuery, hideTitle=false, hideSearchInput=false}: CommentEmbeddingsPageProps) => {
  const classes = useStyles(styles);

  const currentUser = useCurrentUser();
  
  // Search state (handles both text and ID-based searches)
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  const [scoreBias, setScoreBias] = useState<number>(0);
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
      // Check if the external search query looks like a random ID
      if (!isNotRandomId(externalSearchQuery.trim())) {
        // If it's a random ID, use similarity search instead
        setSimilaritySearchVariables({ commentId: externalSearchQuery.trim(), scoreBias });
        setExecuteSimilaritySearch(true);
        setExecuteSearch(false);
      } else {
        // Otherwise, use text search
        setSearchVariables({ query: externalSearchQuery, scoreBias });
        setExecuteSearch(true);
        setExecuteSimilaritySearch(false);
      }
    }
  }, [externalSearchQuery, scoreBias]);

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied explanation='You must be an admin to search comments by embedding' />;
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Check if the search query looks like a random ID
      if (!isNotRandomId(searchQuery.trim())) {
        // If it's a random ID, use similarity search instead
        setSimilaritySearchVariables({ commentId: searchQuery.trim(), scoreBias });
        setExecuteSimilaritySearch(true);
        setExecuteSearch(false);
      } else {
        // Otherwise, use text search
        setSearchVariables({ query: searchQuery, scoreBias });
        setExecuteSearch(true);
        setExecuteSimilaritySearch(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const comments = data?.CommentEmbeddingSearch ?? [];
  const similarComments = similarityData?.CommentEmbeddingSimilaritySearch ?? [];
  const displayComments = executeSearch ? comments : similarComments;
  const displayLoading = executeSearch ? loading : similarityLoading;
  const displayError = executeSearch ? error : similarityError;
  const hasSearched = executeSearch || executeSimilaritySearch;

  return (
    <div className={classes.root}>
        <Typography variant="display2" className={classes.title}>
          Comment Embeddings Search
        </Typography>

      {!hideSearchInput && (
        <div className={classes.searchContainer}>
          <div className={classes.searchRow}>
            <TextField
              className={classes.searchInput}
              label="Search Query or Comment ID"
              placeholder="Enter text to search or a comment ID..."
              value={searchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              fullWidth
              InputLabelProps={{
                className: classes.outlinedLabel,
              }}
            />
            <TextField
              className={classes.scoreBiasInput}
              label="Karma Bias"
              type="number"
              value={scoreBias}
              onChange={(e) => setScoreBias(parseFloat(e.target.value) || 0)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              InputLabelProps={{
                className: classes.outlinedLabel,
              }}
            />
            <Button
              className={classes.searchButton}
              variant="contained"
              color="primary"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || displayLoading}
            >
              Search
            </Button>
          </div>
          <Typography variant="body2" className={classes.helpText}>
            Search for comments using semantic similarity, or enter a comment ID to find similar comments.
          </Typography>
        </div>
      )}
      
      {hideSearchInput && (
        <div className={classes.searchContainer}>
          <div className={classes.searchRow}>
            <TextField
              className={classes.scoreBiasInput}
              label="Karma Bias"
              type="number"
              value={scoreBias}
              onChange={(e) => setScoreBias(parseFloat(e.target.value) || 0)}
              variant="outlined"
              InputLabelProps={{
                className: classes.outlinedLabel,
              }}
            />
          </div>
          <Typography variant="body2" className={classes.helpText}>
            The score bias adjusts the relevance threshold.
          </Typography>
        </div>
      )}

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
