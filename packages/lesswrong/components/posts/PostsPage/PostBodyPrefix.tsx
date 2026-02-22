import { BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD } from '@/components/posts/PostsPage/constants';
import Info from '@/lib/vendor/@material-ui/icons/src/Info';
import { forumSelect } from "../../../lib/forumTypeUtils";
import { siteNameWithArticleSetting } from '../../../lib/instanceSettings';
import { Link } from '../../../lib/reactRouterWrapper';
import { getReviewPhase, postEligibleForReview, reviewIsActive } from '../../../lib/reviewUtils';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import AlignmentPendingApprovalMessage from "../../alignment-forum/AlignmentPendingApprovalMessage";
import LWTooltip from "../../common/LWTooltip";
import { useCurrentUser } from '../../common/withUser';
import UsersNameDisplay from "../../users/UsersNameDisplay";
import LinkPostMessage from "../LinkPostMessage";
import PostPageReviewButton from "./PostPageReviewButton";
import PostsRevisionMessage from "./PostsRevisionMessage";
import RejectionNotice from "./RejectionNotice";

const getShortformDraftMessage = () => "This is a special post that holds your short-form writing. Because it's marked as a draft, your short-form posts will not be displayed. To un-draft it, pick Edit from the menu above, then click Publish.";

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
    maxWidth: 600
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
  LessWrong: 72,
  AlignmentForum: 72,
  default: 24
})

const PostBodyPrefix = ({post, query, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsList|SunshinePostsList,
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

    {post.rejected && <RejectionNotice rejectedReason={post.rejectedReason}/>}
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
    {(((post.contents?.wordCount ?? 0) < BOOKUI_LINKPOST_WORDCOUNT_THRESHOLD)) && <LinkPostMessage post={post} negativeTopMargin={false} />}
    {query?.revision && post.contents && <PostsRevisionMessage post={post} />}
  </>;
}

export default registerComponent('PostBodyPrefix', PostBodyPrefix, {styles});


