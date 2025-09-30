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
    maxWidth: 1200,
    margin: '0 auto',
    padding: theme.spacing.unit * 3,
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
  sectionDivider: {
    marginTop: theme.spacing.unit * 5,
    marginBottom: theme.spacing.unit * 3,
    borderTop: `1px solid ${theme.palette.grey[300]}`,
    paddingTop: theme.spacing.unit * 3,
  },
  sectionTitle: {
    marginBottom: theme.spacing.unit * 2,
  },
  commentIdInput: {
    width: 300,
  },
}));

const CommentEmbeddingsPage = () => {
  const classes = useStyles(styles);

  const currentUser = useCurrentUser();
  
  // Text search state
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreBias, setScoreBias] = useState<number>(0);
  const [executeSearch, setExecuteSearch] = useState(false);
  const [searchVariables, setSearchVariables] = useState<{ query: string; scoreBias: number } | null>(null);

  // Similarity search state
  const [commentId, setCommentId] = useState('');
  const [similarityScoreBias, setSimilarityScoreBias] = useState<number>(0);
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

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied explanation='You must be an admin to search comments by embedding' />;
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSearchVariables({ query: searchQuery, scoreBias });
      setExecuteSearch(true);
      // Clear similarity search when doing text search
      setExecuteSimilaritySearch(false);
    }
  };

  const handleSimilaritySearch = () => {
    if (commentId.trim()) {
      setSimilaritySearchVariables({ commentId, scoreBias: similarityScoreBias });
      setExecuteSimilaritySearch(true);
      // Clear text search when doing similarity search
      setExecuteSearch(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSimilarityKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSimilaritySearch();
    }
  };

  const comments = data?.CommentEmbeddingSearch ?? [];
  const similarComments = similarityData?.CommentEmbeddingSimilaritySearch ?? [];

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.title}>
        Comment Embeddings Search
      </Typography>

      <div className={classes.searchContainer}>
        <div className={classes.searchRow}>
          <TextField
            className={classes.searchInput}
            label="Search Query"
            placeholder="Enter your search query..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            fullWidth
            InputLabelProps={{
              className: classes.outlinedLabel,
            }}
          />
          <TextField
            className={classes.scoreBiasInput}
            label="Score Bias"
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
            disabled={!searchQuery.trim() || loading}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Text Search Results */}
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

        {!loading && executeSearch && comments.length === 0 && (
          <div className={classes.noResultsMessage}>
            <Typography variant="body2">
              No comments found for your search query.
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

      {/* Similarity Search Section */}
      <div className={classes.sectionDivider}>
        <Typography variant="display1" className={classes.sectionTitle}>
          Find Similar Comments
        </Typography>

        <div className={classes.searchContainer}>
          <div className={classes.searchRow}>
            <TextField
              className={classes.commentIdInput}
              label="Comment ID"
              placeholder="Enter a comment ID..."
              value={commentId}
              onChange={(e) => setCommentId(e.target.value)}
              onKeyPress={handleSimilarityKeyPress}
              variant="outlined"
              InputLabelProps={{
                className: classes.outlinedLabel,
              }}
            />
            <TextField
              className={classes.scoreBiasInput}
              label="Score Bias"
              type="number"
              value={similarityScoreBias}
              onChange={(e) => setSimilarityScoreBias(parseFloat(e.target.value) || 0)}
              onKeyPress={handleSimilarityKeyPress}
              variant="outlined"
              InputLabelProps={{
                className: classes.outlinedLabel,
              }}
            />
            <Button
              className={classes.searchButton}
              variant="contained"
              color="primary"
              onClick={handleSimilaritySearch}
              disabled={!commentId.trim() || similarityLoading}
            >
              Find Similar
            </Button>
          </div>
        </div>

        {/* Similarity Search Results */}
        <div className={classes.resultsContainer}>
          {similarityError && (
            <Typography variant="body1" className={classes.errorMessage}>
              Error: {similarityError.message}
            </Typography>
          )}

          {similarityLoading && (
            <div className={classes.loadingContainer}>
              <Loading />
            </div>
          )}

          {!similarityLoading && executeSimilaritySearch && similarComments.length === 0 && (
            <div className={classes.noResultsMessage}>
              <Typography variant="body2">
                No similar comments found.
              </Typography>
            </div>
          )}

          {!similarityLoading && similarComments.length > 0 && (
            <div>
              <Typography variant="body2" className={classes.resultCount}>
                Found {similarComments.length} similar comment{similarComments.length !== 1 ? 's' : ''}
              </Typography>
              {similarComments.map(comment => (
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
      </div>
    </div>
  )
}

export default CommentEmbeddingsPage;
