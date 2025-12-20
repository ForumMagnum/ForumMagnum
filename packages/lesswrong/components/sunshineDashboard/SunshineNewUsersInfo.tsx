import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
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
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

function formatMailgunValidationSummary(validation: any): string {
  if (!validation) return "not validated";
  const status = validation.status as string | undefined;
  const isValid = validation.isValid as boolean | null | undefined;
  const risk = validation.risk as string | null | undefined;
  const reason = validation.reason as string | null | undefined;
  const validatedAt = validation.validatedAt as string | null | undefined;
  const httpStatus = validation.httpStatus as number | null | undefined;
  const err = validation.error as string | null | undefined;
  const result = validation.result as any;

  const resultMessage =
    result && typeof result === "object"
      ? (typeof result.message === "string" ? result.message : null) ??
        (typeof result.error === "string" ? result.error : null) ??
        (typeof result.details === "string" ? result.details : null)
      : null;

  const parts: string[] = [];
  if (typeof isValid === "boolean") parts.push(isValid ? "valid" : "invalid");
  else if (status) parts.push(status);
  if (httpStatus != null) parts.push(`http=${httpStatus}`);
  if (risk) parts.push(`risk=${risk}`);
  if (reason) parts.push(`reason=${reason}`);
  if (validatedAt) parts.push(`at=${validatedAt}`);
  if (resultMessage) parts.push(`msg=${resultMessage}`);
  if (err) parts.push(`error=${err}`);

  return parts.join(" · ") || "validated";
}

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
  const mailgunValidationSummary = currentUser.isAdmin
    ? formatMailgunValidationSummary((user as any).mailgunValidation)
    : null;
  
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
              {currentUser.isAdmin && <div>Mailgun: {mailgunValidationSummary}</div>}
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


