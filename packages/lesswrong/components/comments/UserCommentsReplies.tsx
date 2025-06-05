import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { getUserFromResults } from '../users/UsersProfile';
import { slugify } from '@/lib/utils/slugify';
import CommentsNodeInner from "./CommentsNode";
import LoadMore from "../common/LoadMore";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import { useQuery, NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentUserCommentsRepliesQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const UsersProfileMultiQuery = gql(`
  query multiUserUserCommentsRepliesQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...UsersProfile
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  }
})

const UserCommentsReplies = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const { params } = useLocation();
  const slug = slugify(params.slug);

  const { data } = useQuery(UsersProfileMultiQuery, {
    variables: {
      selector: { usersProfile: { slug } },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const userResults = data?.users?.results;
  const user = getUserFromResults(userResults ?? null)
  const { data: dataCommentsListWithParentMetadata, networkStatus, loadMoreProps } = useQueryWithLoadMore(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { allRecentComments: { authorIsUnreviewed: null, userId: user?._id } },
      limit: 50,
      enableTotal: false,
    },
    skip: !user,
  });

  const results = dataCommentsListWithParentMetadata?.comments?.results;

  const loadingInitial = networkStatus === NetworkStatus.loading;
  
  if (loadingInitial || !user) return <Loading />
  if (!results || results.length < 1) return <SingleColumnSection>
    This user has not made any comments
  </SingleColumnSection>

  return (
    <SingleColumnSection>
      <SectionTitle title={`All of ${user.displayName}'s Comments + Replies`}/>
      <div className={classes.root}>
        {results.map(comment =>
          <div key={comment._id}>
            <CommentsNodeInner
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true
              }}
              comment={comment}
              startThreadTruncated={true}
              loadChildrenSeparately
              loadDirectReplies
            />
          </div>
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    </SingleColumnSection>
  )
};

export default registerComponent('UserCommentsReplies', UserCommentsReplies, { styles });


