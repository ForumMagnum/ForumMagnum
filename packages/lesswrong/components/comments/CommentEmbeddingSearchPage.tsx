import React, { useState } from 'react';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { DocumentNode, gql, useQuery } from '@apollo/client';
import Input from '@material-ui/core/Input';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import Button from '@material-ui/core/Button';

const styles = defineStyles('CommentEmbeddingSearchPage', (theme: ThemeType) => ({
  root: {},
  input: {
    marginBottom: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
  },
  scoreBiasInput: {
    marginRight: theme.spacing.unit * 2,
  },
}));

const getCommentEmbeddingSearchQuery = (() => {
  let query: DocumentNode;
  return () => {
    if (!query) {
      query = gql`
        query CommentEmbeddingSearchQuery($query: String!, $scoreBias: Float) {
          CommentEmbeddingSearch(query: $query, scoreBias: $scoreBias) {
            ...CommentsListWithParentMetadata
          }
        }
        ${fragmentTextForQuery('CommentsListWithParentMetadata')}
      `;
    }
    return query;
  }
})();

const useCommentEmbeddingSearchQuery = (query: string, scoreBias: number) => {
  const { data, loading, error } = useQuery<{ CommentEmbeddingSearch: CommentsListWithParentMetadata[] }>(
    getCommentEmbeddingSearchQuery(),
    {
      skip: !query,
      variables: { query, scoreBias }
    },
  );

  return { data, loading, error };
}

export const CommentEmbeddingSearchPage = () => {
  const { SingleColumnSection, Loading, CommentsNode } = Components;
  
  const classes = useStyles(styles);
  const [displayQuery, setDisplayQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [scoreBias, setScoreBias] = useState(0.1);
  const { data, loading } = useCommentEmbeddingSearchQuery(userQuery, scoreBias);

  const updateUserQuery = useDebouncedCallback((query: string) => {
    setUserQuery(query);
  }, {
    rateLimitMs: 300,
    callOnLeadingEdge: true,
    onUnmount: "cancelPending",
    allowExplicitCallAfterUnmount: false,
  });

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayQuery(e.target.value);
  }

  return <SingleColumnSection>
    <Input
      className={classes.input}
      value={displayQuery}
      onChange={handleUserInput}
      placeholder="Search for comments"
    />
    <Input
      className={classes.scoreBiasInput}
      value={scoreBias}
      onChange={(e) => setScoreBias(Number(e.target.value))}
      placeholder="Score bias (0-1)"
    />
    <Button onClick={() => {
      updateUserQuery(displayQuery);
    }}>
      Submit
    </Button>
    <div className={classes.root}>
      {loading && !!userQuery && <Loading />}
      <div>
        {data?.CommentEmbeddingSearch.map((comment) => (
          <CommentsNode
            key={comment._id}
            comment={comment}
            startThreadTruncated={true}
            treeOptions={{
              post: comment.post || undefined,
              tag: comment.tag || undefined,
              showPostTitle: true,
              forceNotSingleLine: true
            }}
          />
        ))}
      </div>
    </div>
  </SingleColumnSection>;
}

const CommentEmbeddingSearchPageComponent = registerComponent('CommentEmbeddingSearchPage', CommentEmbeddingSearchPage);

declare global {
  interface ComponentTypes {
    CommentEmbeddingSearchPage: typeof CommentEmbeddingSearchPageComponent
  }
}

