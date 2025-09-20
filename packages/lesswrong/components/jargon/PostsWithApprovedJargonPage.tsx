"use client";

import React, { useState } from 'react';
import moment from 'moment';
import { NetworkStatus } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import { userIsAdmin } from '@/lib/vulcan-users/permissions.ts';
import { useCurrentUser } from '../common/withUser';
import { registerComponent } from "../../lib/vulcan-lib/components";
import PostsItem from "../posts/PostsItem";
import JargonTooltip from "./JargonTooltip";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import ContentStyles from "../common/ContentStyles";
import LoadMore from "../common/LoadMore";
import Loading from "../vulcan-core/Loading";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import { gql } from '@/lib/generated/gql-codegen';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2
  },
  post: {
    marginBottom: theme.spacing.unit * 4,
  },
  jargonTerms: {
    marginTop: theme.spacing.unit * 0.5,
    display: 'flex',
    flexWrap: 'wrap',
  },
  jargonTerm: {
    margin: theme.spacing.unit * .5,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    padding: `${theme.spacing.unit * .5}px ${theme.spacing.unit * 1}px`,
    borderRadius: 3,
  },
  empty: {},
  loadMore: {
    marginTop: 10
  },
  loadMoreSpinner: {
    textAlign: 'left',
    paddingTop: 6,
    paddingLeft: 10,
    margin: 0
  }
});

const PostListItemWithJargon = ({ post, jargonTerms, classes }: {
  post: PostsListWithVotes,
  jargonTerms: JargonTerms[],
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.post}>
    <PostsItem post={post}/>
    <div className={classes.jargonTerms}>
      {jargonTerms.map(jargonTerm => {
        const { _id, postId, contents, ...rest } = jargonTerm;
        const definitionHTML = contents?.html ?? '';
        return <JargonTooltip key={_id} forceTooltip definitionHTML={definitionHTML} tooltipClassName={classes.jargonTerm} {...rest}>
          {jargonTerm.term}
          </JargonTooltip>;
        })}
    </div>
  </div>
};

export const PostsWithApprovedJargonPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const [limit, setLimit] = useState(15);
  const pageSize = 20;

  const currentUser = useCurrentUser();

  const getPostsQuery = gql(`
    query getPostsWithApprovedJargon($limit: Int!) {
      PostsWithApprovedJargon(limit: $limit) {
        results {
          post {
            ...PostsListWithVotes
          }
          jargonTerms {
            ...JargonTerms
          }
        }
      }
    }
  `);

  const { data, loading, fetchMore, networkStatus } = useQuery(getPostsQuery, {
    variables: { limit },
  });

  const postsWithJargon = data?.PostsWithApprovedJargon?.results ?? [];

  if (!userIsAdmin(currentUser)) {
    return <ErrorAccessDenied />
  }

  if (loading || networkStatus === NetworkStatus.loading) {
    return <Loading/>;
  }

  if (!postsWithJargon?.length) {
    return <SingleColumnSection>
      <div className={classes.empty}>No posts with approved jargon found.</div>
    </SingleColumnSection>;
  }

  // Group posts by ~publish date
  const todaysPosts = postsWithJargon.filter(({ post }) => moment(post.postedAt).isSame(moment(), 'day'));
  const yesterdaysPosts = postsWithJargon.filter(({ post }) => moment(post.postedAt).isSame(moment().subtract(1, 'day'), 'day'));
  const olderPosts = postsWithJargon.filter(({ post }) => moment(post.postedAt).isBefore(moment().subtract(1, 'day'), 'day'));

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Posts with Approved Jargon" />
      <ContentStyles contentType="post">
        <p>Posts that have had any jargon terms approved.</p>
      </ContentStyles>
      
      {!!todaysPosts.length && <SectionTitle title="Today"/>}
      {todaysPosts.map(({ post, jargonTerms }) => {
        return <PostListItemWithJargon key={post._id} post={post} jargonTerms={jargonTerms} classes={classes} />
      })}
      
      {!!yesterdaysPosts.length && <SectionTitle title="Yesterday"/>}
      {yesterdaysPosts.map(({ post, jargonTerms }) => {
        return <PostListItemWithJargon key={post._id} post={post} jargonTerms={jargonTerms} classes={classes} />
      })}
      
      {!!olderPosts.length && <SectionTitle title="Older"/>}
      {olderPosts.map(({ post, jargonTerms }) => {
        return <PostListItemWithJargon key={post._id} post={post} jargonTerms={jargonTerms} classes={classes} />
      })}
      
      <div className={classes.loadMore}>
        <LoadMore
          loading={loading || networkStatus === NetworkStatus.fetchMore}
          loadMore={() => {
            const newLimit = limit + pageSize;
            void fetchMore({
              variables: {
                limit: newLimit
              },
              updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;
                return fetchMoreResult
              }
            })
            setLimit(newLimit);
          }}
        />
      </div>
    </SingleColumnSection>
  </div>;
}

export default registerComponent('PostsWithApprovedJargonPage', PostsWithApprovedJargonPage, {styles});


