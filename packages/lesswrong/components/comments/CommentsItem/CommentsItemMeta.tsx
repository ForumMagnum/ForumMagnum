import React, { useState }  from "react";
import classNames from "classnames";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import { isEAForum } from "../../../lib/instanceSettings";
import { userIsPostCoauthor } from "../../../lib/collections/posts/helpers";
import { useCommentLink } from "./useCommentLink";
import { Comments } from "../../../lib/collections/comments";
import { userIsAdmin } from "../../../lib/vulcan-users";
import { useCurrentUser } from "../../common/withUser";
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import type { CommentTreeOptions } from "../commentTree";

export const metaNoticeStyles = (theme: ThemeType) => ({
    color: theme.palette.lwTertiary.main,
    fontSize: "1rem",
    marginBottom: theme.spacing.unit,
    marginLeft: theme.spacing.unit / 2,
    ...theme.typography.italic,
});

const styles = (theme: ThemeType): JssStyles => ({
  meta: {
    "& > div": {
      display: "inline-block",
      marginRight: 5,
    },

    marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: `${theme.palette.linkHover.dim} !important`,
    },
  },
  sideCommentMeta: {
    display: "flex",
    alignItems: "baseline",
  },
  metaNotice: {
    ...metaNoticeStyles(theme),
  },
  collapse: {
    marginRight: 5,
    opacity: 0.8,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    paddingBottom: 4,
    display: "inline-block",
    verticalAlign: "middle",

    "& span": {
      fontFamily: "monospace",
    },
  },
  username: {
    marginRight: 10,

    "$sideCommentMeta &": {
      flexGrow: 1,
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      flexShrink: 1,
      display: "inline-block",
      overflowX: "hidden",
    },
  },
  moderatorHat: {
    marginRight: 8,
  },
  relevantTags: {
    marginLeft: 12,
    position: "relative",
    top: -2,
    "& .FooterTag-root:nth-child(n+4)": {
      marginTop: 8,
    },
  },
  relevantTag: {
    marginTop: 4,
  },
  showMoreTags: {
    position: "relative",
    top: 1,
    color: theme.palette.grey[500],
    fontSize: 12,
    marginLeft: 8,
  },
  rightSection: {
    float: "right",
    marginRight: isEAForum ? -3 : -5,
    marginTop: isEAForum ? 4 : undefined,
  },
  linkIcon: {
    fontSize: "1.2rem",
    verticalAlign: "top",
    color: theme.palette.icon.dim,
    margin: "0 4px",
    position: "relative",
    top: 1,
  },
  menu: isEAForum
    ? {
      color: theme.palette.icon.dim,
    }
    : {
      opacity: 0.35,
    },
});

export const CommentsItemMeta = ({
  treeOptions,
  comment,
  showCommentTitle,
  isParentComment,
  parentCommentId,
  showParentState,
  toggleShowParent,
  scrollIntoView,
  parentAnswerId,
  setSingleLine,
  collapsed,
  toggleCollapse,
  setShowEdit,
  classes,
}: {
  treeOptions: CommentTreeOptions,
  comment: CommentsList|CommentsListWithParentMetadata,
  showCommentTitle: boolean,
  isParentComment?: boolean,
  parentCommentId?: string,
  showParentState: boolean,
  toggleShowParent: () => void,
  scrollIntoView?: () => void,
  parentAnswerId?: string,
  setSingleLine?: (singleLine: boolean) => void,
  collapsed?: boolean,
  toggleCollapse?: () => void,
  setShowEdit: () => void,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();

  const {
    postPage, showCollapseButtons, post, tag, singleLineCollapse, isSideComment,
    hideActionsMenu,
  } = treeOptions;

  const authorIsPostAuthor = post &&
    (post.userId === comment.userId || userIsPostCoauthor(comment.user, post));

  const commentLinkProps = {
    comment,
    post,
    tag,
    scrollIntoView,
    scrollOnClick: postPage && !isParentComment,
  };
  const CommentLinkWrapper = useCommentLink(commentLinkProps);

  /**
   * Show the moderator comment annotation if:
   * 1) it has the moderatorHat
   * 2) the user is either an admin, or the moderatorHat isn't deliberately hidden
   */
  const showModeratorCommentAnnotation = comment.moderatorHat && (
    userIsAdmin(currentUser)
      ? true
      : !comment.hideModeratorHat
    );

  const moderatorCommentAnnotation = comment.hideModeratorHat
    ? "Moderator Comment (Invisible)"
    : "Moderator Comment";

  const getReviewLink = (year: string) => {
    // We changed our review page in 2018 and 2019. In 2020 we came up with a page
    // that we'll hopefully stick with for awhile.
    if (year === "2018" || year === "2019") {
      return `/reviews/${year}`;
    }
    return `/reviewVoting/${year}`;
  }

  const reviewingForReview = isEAForum && comment.reviewingForReview === "2020"
    ? "the Decade"
    : comment.reviewingForReview;

  const [showMoreClicked, setShowMoreClicked] = useState(false);
  let relevantTagsTruncated = comment.relevantTags ?? [];
  let shouldDisplayLoadMore = false;
  if (!showMoreClicked) {
    shouldDisplayLoadMore = relevantTagsTruncated.length > 1 && !showMoreClicked;
    relevantTagsTruncated = relevantTagsTruncated.slice(0, 1);
  }

  const {
    CommentShortformIcon, CommentDiscussionIcon, ShowParentComment, CommentUserName,
    CommentsItemDate, SmallSideVote, CommentOutdatedWarning, FooterTag, LoadMore,
    ForumIcon, CommentsMenu,
  } = Components;

  return (
    <div className={classNames(classes.meta, {
      [classes.sideCommentMeta]: isSideComment,
    })}>
      {!parentCommentId && !comment.parentCommentId && isParentComment &&
        <div>○</div>
      }
      {post && <CommentShortformIcon comment={comment} post={post} />}
      {!showCommentTitle && <CommentDiscussionIcon comment={comment} small />}
      {parentCommentId !== comment.parentCommentId &&
          parentAnswerId !== comment.parentCommentId &&
        <ShowParentComment
          comment={comment}
          active={showParentState}
          onClick={toggleShowParent}
        />
      }
      {(showCollapseButtons || collapsed) &&
        <a className={classes.collapse} onClick={toggleCollapse}>
          [<span>{collapsed ? "+" : "-"}</span>]
        </a>
      }
      {singleLineCollapse && <a className={classes.collapse} onClick={() =>
        setSingleLine && setSingleLine(true)
      }>
        [<span>{collapsed ? "+" : "-"}</span>]
      </a>}
      <CommentUserName
        comment={comment}
        className={classes.username}
        isPostAuthor={authorIsPostAuthor}
      />
      <CommentsItemDate {...commentLinkProps} />
      {showModeratorCommentAnnotation &&
        <span className={classes.moderatorHat}>
          {moderatorCommentAnnotation}
        </span>
      }
      <SmallSideVote
        document={comment}
        collection={Comments}
        hideKarma={post?.hideCommentKarma}
      />

      {post && <CommentOutdatedWarning comment={comment} post={post}/>}

      {comment.nominatedForReview &&
        <Link
          to={`/nominations/${comment.nominatedForReview}`}
          className={classes.metaNotice}
        >
          {`Nomination for ${comment.nominatedForReview} Review`}
        </Link>
      }

      {comment.reviewingForReview &&
        <Link
          to={getReviewLink(comment.reviewingForReview)}
          className={classes.metaNotice}
        >
          {`Review for ${reviewingForReview} Review`}
        </Link>
      }

      {!!relevantTagsTruncated.length && <span className={classes.relevantTags}>
        {relevantTagsTruncated.map(tag =>
          <FooterTag
            tag={tag}
            key={tag._id}
            className={classes.relevantTag}
            neverCoreStyling
            smallText
          />
        )}
        {shouldDisplayLoadMore && <LoadMore
          loadMore={() => setShowMoreClicked(true)}
          message="Show more"
          className={classes.showMoreTags}
        />}
      </span>}

      <span className={classes.rightSection}>
        {isEAForum &&
          <CommentLinkWrapper>
            <ForumIcon icon="Link" className={classes.linkIcon} />
          </CommentLinkWrapper>
        }
        {!isParentComment && !hideActionsMenu &&
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu
              className={classes.menu}
              comment={comment}
              post={post}
              tag={tag}
              showEdit={setShowEdit}
            />
          </AnalyticsContext>
        }
      </span>
    </div>
  );
}

const CommentsItemMetaComponent = registerComponent(
  "CommentsItemMeta",
  CommentsItemMeta,
  {styles},
);

declare global {
  interface ComponentTypes {
    CommentsItemMeta: typeof CommentsItemMetaComponent,
  }
}
