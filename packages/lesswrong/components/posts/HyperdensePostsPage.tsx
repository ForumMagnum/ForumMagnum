"use client";

import React, { useState, useEffect, useRef } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { decodeIntlError } from '@/lib/vulcan-lib/utils';
import FormattedMessage from '@/lib/vulcan-i18n/message';
import HyperdensePostCard from './HyperdensePostCard';
import PostsLoading from './PostsLoading';
import { usePostsList } from './usePostsList';
import LoadMore from '../common/LoadMore';
import SectionFooter from '../common/SectionFooter';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import classNames from 'classnames';

const Error = ({error}: any) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}}/>{error.message}
</div>;

const styles = defineStyles('HyperdensePostsPage', (theme: ThemeType) => ({
  container: {
    marginTop: -48,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 8,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
    gap: 10,
  },
  cardWrapper: {
    height: 350,
    overflow: 'visible',
  },
  loadingSpinner: {
    display: 'flex',
    justifyContent: 'center',
    padding: 20,
  },
}));

const INITIAL_LIMIT = 15;
const ITEMS_PER_PAGE = 50;

const HyperdensePostsPage = () => {
  const classes = useStyles(styles);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const hasAutoLoaded = useRef(false);

  const {
    orderedResults,
    loading,
    error,
    loadMore,
    loadMoreProps,
    maybeMorePosts,
  } = usePostsList({
    terms: {
      view: "frontpage",
      limit: INITIAL_LIMIT,
    },
    showLoadMore: false,
    showNoResults: false,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  const posts = (orderedResults ?? []) as PostsListWithVotes[];

  useEffect(() => {
    if (!loading && posts.length === INITIAL_LIMIT && !hasAutoLoaded.current) {
      hasAutoLoaded.current = true;
      // Wait a bit to ensure initial render completes before loading more
      const timeoutId = setTimeout(() => {
        void loadMore();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [loading, posts.length, loadMore]);

  const handleToggle = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  if (loading && !posts.length) {
    return (
      <div className={classNames(classes.container, classes.loadingSpinner)}>
        <PostsLoading placeholderCount={INITIAL_LIMIT} viewType="list" />
      </div>
    );
  }

  return (
    <div className={classes.container}>
      {error && <Error error={decodeIntlError(error)}/>}
      <div className={classes.grid}>
        {posts.map((post) => (
          <div key={post._id} className={classes.cardWrapper}>
            <HyperdensePostCard 
              post={post} 
              baseHeight={350} 
              isExpanded={expandedPostId === post._id}
              onToggle={() => handleToggle(post._id)}
            />
          </div>
        ))}
      </div>

      {maybeMorePosts && (
        <SectionFooter>
          <LoadMore
            {...loadMoreProps}
            loading={loading}
            loadMore={loadMore}
            sectionFooterStyles
          />
        </SectionFooter>
      )}
    </div>
  );
};

export default HyperdensePostsPage;
