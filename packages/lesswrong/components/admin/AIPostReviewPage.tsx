"use client";
import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import Loading from '../vulcan-core/Loading';
import AIPostReviewSection from './AIPostReviewSection';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const tagQuery = gql(`
  query aiPostReviewTagQuery($selector: TagSelector, $limit: Int) {
    tags(selector: $selector, limit: $limit) {
      results {
        _id
      }
    }
  }
`);

const postsQuery = gql(`
  query aiPostReviewPostsQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsListBase
        automatedContentEvaluations {
          ...AutomatedContentEvaluationsFragment
        }
      }
    }
  }
`);

const styles = defineStyles('AIPostReviewPage', (theme: ThemeType) => ({
  root: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: theme.spacing.unit * 3,
  },
}));

const AIPostReviewPage = () => {
  const currentUser = useCurrentUser();
  const classes = useStyles(styles);
  const { data: tagData, loading: tagLoading } = useQuery(tagQuery, {
    variables: { selector: { tagBySlug: { slug: "ai" } }, limit: 1 },
  });
  const tagId = tagData?.tags?.results?.[0]?._id;

  const aiTagFilter = { personalBlog: "Default" as const, tags: [{ tagId: tagId ?? "", tagName: "AI", filterMode: "Required" as const }] };

  const { data: recentData, loading: recentLoading } = useQuery(postsQuery, {
    variables: {
      selector: { new: { filterSettings: aiTagFilter } },
      limit: 25,
    },
    skip: !tagId,
  });

  const { data: topData, loading: topLoading } = useQuery(postsQuery, {
    variables: {
      selector: { top: { filterSettings: aiTagFilter } },
      limit: 25,
    },
    skip: !tagId,
  });

  const { data: unreviewedData, loading: unreviewedLoading } = useQuery(postsQuery, {
    variables: {
      selector: { new: { authorIsUnreviewed: true, filterSettings: aiTagFilter } },
      limit: 25,
    },
    skip: !tagId,
  });

  if (!currentUser || !userIsAdmin(currentUser)) {
    return <ErrorAccessDenied />;
  }

  if (tagLoading) {
    return <SingleColumnSection>
      <SectionTitle title="AI Post Review" />
      <Loading />
    </SingleColumnSection>;
  }

  const recentPosts = (recentData?.posts?.results ?? []).filter(p => !p.draft);
  const topPosts = (topData?.posts?.results ?? []).filter(p => !p.draft);
  const unreviewedPosts = (unreviewedData?.posts?.results ?? []).filter(p => !p.draft);

  return <div className={classes.root}>
    <SectionTitle title="AI Post Review" />
    <AIPostReviewSection title="Unreviewed Authors" posts={unreviewedPosts} loading={unreviewedLoading} />
    <AIPostReviewSection title="Recent AI Posts" posts={recentPosts} loading={recentLoading} />
    <AIPostReviewSection title="Top Karma AI Posts" posts={topPosts} loading={topLoading} />
  </div>;
};

export default AIPostReviewPage;
