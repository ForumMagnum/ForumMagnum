import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import * as _ from 'underscore';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { CONTENT_LIMIT, DEFAULT_BIO_WORDCOUNT, MAX_BIO_WORDCOUNT } from './UsersReviewInfoCard';
import { truncate } from '../../lib/editor/ellipsize';
import { usePublishedPosts } from '../hooks/usePublishedPosts';
import MetaInfo from "../common/MetaInfo";
import SunshineNewUserPostsList from "./SunshineNewUserPostsList";
import SunshineNewUserCommentsList from "./SunshineNewUserCommentsList";
import ContentSummaryRows from "./ModeratorUserInfo/ContentSummaryRows";
import LWTooltip from "../common/LWTooltip";
import UserAutoRateLimitsDisplay from "./ModeratorUserInfo/UserAutoRateLimitsDisplay";
import { Typography } from "../common/Typography";
import SunshineSendMessageWithDefaults from "./SunshineSendMessageWithDefaults";
import UserReviewStatus from "./ModeratorUserInfo/UserReviewStatus";
import ModeratorMessageCount from "./ModeratorMessageCount";
import UserReviewMetadata from "./ModeratorUserInfo/UserReviewMetadata";
import ModeratorActions from "./ModeratorActions";
import NewUserDMSummary from "./ModeratorUserInfo/NewUserDMSummary";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentSunshineNewUsersInfoQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.grey[50]
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
  },
  votesRow: {
    marginTop: 12,
    marginBottom: 12
  },
  hr: {
    height: 0,
    borderTop: "none",
    borderBottom: theme.palette.border.sunshineNewUsersInfoHR,
  },
  bio: {
    wordBreak: "break-word",
    '& a': {
      color: theme.palette.primary.main,
    },
  },
  website: {
    color: theme.palette.primary.main,
  },
  info: {
    '& > * + *': {
      marginTop: 8,
    },
  },
})

const SunshineNewUsersInfo = ({ user, classes, refetch, currentUser }: {
  user: SunshineUsersList,
  classes: ClassesType<typeof styles>,
  refetch: () => void,
  currentUser: UsersCurrent
}) => {

  const [bioWordcount, setBioWordcount] = useState<number>(DEFAULT_BIO_WORDCOUNT)

  const { posts = [], loading: postsLoading } = usePublishedPosts(user._id, CONTENT_LIMIT);

  const { data, loading: commentsLoading } = useQuery(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { sunshineNewUsersComments: { userId: user._id } },
      limit: CONTENT_LIMIT,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const comments = data?.comments?.results ?? [];
  if (!userCanDo(currentUser, "posts.moderate.all")) return null
  const bioHtml = truncate(user.htmlBio, bioWordcount, "words")
  
  // All elements in this component should also appar in UsersReviewInfoCard
  return (
      <div className={classes.root}>
        <Typography variant="body2">
          <MetaInfo>
            <UserReviewMetadata user={user}/>
            <UserAutoRateLimitsDisplay user={user} showKarmaMeta/>
            <div className={classes.info}>
              <div className={classes.topRow}>
                <UserReviewStatus user={user}/>
                <div className={classes.row}>
                  <ModeratorMessageCount userId={user._id} />
                  <SunshineSendMessageWithDefaults user={user}/>
                </div>
              </div>              
              <div dangerouslySetInnerHTML={{__html: bioHtml}} className={classes.bio} onClick={() => setBioWordcount(MAX_BIO_WORDCOUNT)}/>
              {user.website && <div>Website: <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={classes.website}>{user.website}</a></div>}
            </div>
            <ModeratorActions user={user} currentUser={currentUser} comments={comments} posts={posts} refetch={refetch}/>
            <hr className={classes.hr}/>
            <div className={classes.votesRow}>
              <span>Votes: </span>
              <LWTooltip title="Big Upvotes">
                <span className={classes.bigUpvotes}>
                  { user.bigUpvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Upvotes">
                <span className={classes.upvotes}>
                  { user.smallUpvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Downvotes">
                <span className={classes.downvotes}>
                  { user.smallDownvoteCount || 0 }
                </span>
              </LWTooltip>
              <LWTooltip title="Big Downvotes">
                <span className={classes.bigDownvotes}>
                  { user.bigDownvoteCount || 0 }
                </span>
              </LWTooltip>
            </div>
            <ContentSummaryRows user={user} posts={posts} comments={comments} loading={postsLoading || commentsLoading}/>
            <NewUserDMSummary user={user} />
            <SunshineNewUserPostsList posts={posts} user={user}/>
            <SunshineNewUserCommentsList comments={comments} user={user}/>
          </MetaInfo>
        </Typography>
      </div>
  )
}

export default registerComponent('SunshineNewUsersInfo', SunshineNewUsersInfo, {
  styles,
  hocs: [
    withErrorBoundary,
  ]
});


