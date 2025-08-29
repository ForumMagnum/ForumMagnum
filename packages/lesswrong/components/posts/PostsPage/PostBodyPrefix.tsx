import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import Info from '@/lib/vendor/@material-ui/icons/src/Info';
import { siteNameWithArticleSetting } from '../../../lib/instanceSettings';
import { useCurrentUser } from '../../common/withUser';
import { getReviewPhase, postEligibleForReview, reviewIsActive } from '../../../lib/reviewUtils';
import { forumSelect } from "../../../lib/forumTypeUtils";
import { Link } from '../../../lib/reactRouterWrapper';
import { isFriendlyUI } from '../../../themes/forumTheme';
import UsersNameDisplay from "../../users/UsersNameDisplay";
import AlignmentPendingApprovalMessage from "../../alignment-forum/AlignmentPendingApprovalMessage";
import LinkPostMessage from "../LinkPostMessage";
import PostsRevisionMessage from "./PostsRevisionMessage";
import LWTooltip from "../../common/LWTooltip";
import { ContentItemBody } from "../../contents/ContentItemBody";
import ContentStyles from "../../common/ContentStyles";
import PostPageReviewButton from "./PostPageReviewButton";
import { BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD } from '@/components/posts/PostsPage/constants';

const getShortformDraftMessage = () => isFriendlyUI()
  ? "This is a special post that holds your quick takes. Because it's marked as a draft, your quick takes will not be displayed. To un-draft it, pick Edit from the menu above, then click Publish."
  : "This is a special post that holds your short-form writing. Because it's marked as a draft, your short-form posts will not be displayed. To un-draft it, pick Edit from the menu above, then click Publish.";

const styles = (theme: ThemeType) => ({
  reviewInfo: {
    textAlign: "center",
    marginBottom: 32
  },
  reviewLabel: {
    ...theme.typography.postStyle,
    ...theme.typography.contentNotice,
    marginBottom: theme.spacing.unit,
  },
  contentNotice: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle,
    maxWidth: 600,
    ...(theme.isFriendlyUI && {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }),
  },
  rejectionNotice: {
    ...theme.typography.contentNotice,
    ...theme.typography.postStyle,
    maxWidth: 600,
    opacity: .75,
    marginBottom: 40
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginLeft: theme.spacing.unit,
    verticalAlign: "top",
    color: theme.palette.icon.dim2,
  },
});

const getForumNewUserProcessingTime = () => forumSelect({
  EAForum: 24,
  LessWrong: 72,
  AlignmentForum: 72,
  default: 24
})

const PostBodyPrefix = ({post, query, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList,
  query?: any,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  return <>
    {reviewIsActive() && postEligibleForReview(post) && getReviewPhase() !== "RESULTS" && <PostPageReviewButton post={post}/>}

    <AlignmentPendingApprovalMessage post={post} />

    {post.shortform && post.draft && <div className={classes.contentNotice}>
      {getShortformDraftMessage()}
    </div>}
    {post.shortform && !post.draft && <div className={classes.contentNotice}>
      <>
        This is a special post for quick takes by <UsersNameDisplay user={post.user}/>. Only they can create top-level comments. Comments here also appear on the <Link to="/quicktakes">Quick Takes page</Link> and <Link to="/allPosts">All Posts page</Link>.
      </>
    </div>}

    {post.rejected && <div className={classes.rejectionNotice}>
      <p>This post was rejected{post.rejectedReason && " for the following reason(s):"}</p>
      <ContentStyles contentType="postHighlight">
        <ContentItemBody dangerouslySetInnerHTML={{__html: post.rejectedReason || "" }}/>
      </ContentStyles>
    </div>}
    {!post.rejected && post.authorIsUnreviewed && !post.draft && <div className={classes.contentNotice}>
      {currentUser?._id === post.userId
        ? "Because this is your first post, this post is awaiting moderator approval."
        : "This post is unlisted and is still awaiting moderation.\nUsers' first posts need to be approved by a moderator."
      }
      <LWTooltip title={<p>
        New users' first posts on {siteNameWithArticleSetting.get()} are checked by moderators before they appear on the site.
        Most posts will be approved within {getForumNewUserProcessingTime()} hours; posts that are spam or that don't meet site
        standards will be deleted. After you've had a post approved, future posts will appear
        immediately without waiting for review.
      </p>}>
        <Info className={classes.infoIcon}/>
      </LWTooltip>
    </div>}
    {(isFriendlyUI() || ((post.contents?.wordCount ?? 0) < BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD)) && <LinkPostMessage post={post} negativeTopMargin={isFriendlyUI()} />}
    {query?.revision && post.contents && <PostsRevisionMessage post={post} />}
  </>;
}

export default registerComponent('PostBodyPrefix', PostBodyPrefix, {styles});


