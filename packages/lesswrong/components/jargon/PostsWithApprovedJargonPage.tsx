import React, { useState } from 'react';
import moment from 'moment';
import { NetworkStatus, gql } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
import { userIsAdmin } from '@/lib/vulcan-users/permissions.ts';
import { useCurrentUser } from '../common/withUser';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";

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

interface PostWithJargon {
  post: PostsListWithVotes,
  jargonTerms: JargonTerms[],
}

const PostListItemWithJargon = ({ post, jargonTerms, classes }: {
  post: PostsListWithVotes,
  jargonTerms: JargonTerms[],
  classes: ClassesType<typeof styles>,
}) => {
  const { PostsItem, JargonTooltip } = Components;
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
  const { SingleColumnSection, SectionTitle, ContentStyles, LoadMore, Loading, ErrorAccessDenied } = Components;

  const [limit, setLimit] = useState(15);
  const pageSize = 20;

  const currentUser = useCurrentUser();

  const getPostsQuery = gql`
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
    ${fragmentTextForQuery('PostsListWithVotes')}
    ${fragmentTextForQuery('JargonTerms')}
  `;

  const { data, loading, fetchMore, networkStatus } = useQuery(getPostsQuery, {
    variables: { limit },
  });

  const postsWithJargon: PostWithJargon[] = data?.PostsWithApprovedJargon?.results ?? [];

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

const PostsWithApprovedJargonPageComponent = registerComponent('PostsWithApprovedJargonPage', PostsWithApprovedJargonPage, {styles});

declare global {
  interface ComponentTypes {
    PostsWithApprovedJargonPage: typeof PostsWithApprovedJargonPageComponent
  }
}
