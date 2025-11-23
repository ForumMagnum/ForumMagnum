"use client";

import React, { useState } from 'react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import type { PostsListWithVotes } from '@/lib/generated/gql-codegen/graphql';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import HyperdensePostCard from './HyperdensePostCard';
import Loading from '@/components/vulcan-core/Loading';

const HyperdensePostsQuery = gql(`
  query HyperdensePostsQuery($limit: Int) {
    posts(selector: { frontpage: {} }, limit: $limit) {
      results {
        ...PostsListWithVotes
      }
    }
  }
`);

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
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: 10,
  },
  cardWrapper: {
    height: 350,
    overflow: 'visible',
  },
}));

const HyperdensePostsPage = () => {
  const classes = useStyles(styles);
  const { data, loading } = useQuery(HyperdensePostsQuery, {
    variables: { limit: 24 },
  });
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const posts = data?.posts?.results ?? [];

  const handleToggle = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  return (
    <div className={classes.container}>
      {loading ? (
        <Loading />
      ) : (
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
      )}
    </div>
  );
};

export default HyperdensePostsPage;

