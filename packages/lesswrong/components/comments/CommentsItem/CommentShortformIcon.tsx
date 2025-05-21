import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { commentGetPageUrlFromIds } from "../../../lib/collections/comments/helpers";
import { Link } from '../../../lib/reactRouterWrapper';
import { isEAForum } from '../../../lib/instanceSettings';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';
import LWTooltip from "../../common/LWTooltip";
import ForumIcon from "../../common/ForumIcon";

const styles = defineStyles("CommentShortformIcon", (theme: ThemeType) => ({
  smallIcon: isFriendlyUI ? {
    cursor: "pointer",
    color: theme.palette.grey[1000],
    height: 16,
    marginLeft: -2,
    marginRight: 3,
    position: "relative",
    top: 2
  } : {
    cursor: "pointer",
    color: theme.palette.grey[600],
    width: 13,
    height: 13,
    marginLeft: -2,
    marginRight: theme.spacing.unit,
    position: "relative",
    top: 2
  },
}));

const CommentShortformIcon = ({comment, post, simple, iconClassName}: {
  comment: CommentsList,
  post: PostsMinimumInfo,
  simple?: boolean,
  iconClassName?: string,
}) => {
  const classes = useStyles(styles);
  // Top level shortform posts should show this icon/button, both to make shortform posts a bit more visually distinct, and to make it easier to grab permalinks for shortform posts.
  if (!comment.shortform || comment.topLevelCommentId || isEAForum) return null
  
  if (simple) return <ForumIcon icon="Shortform" className={classNames(classes.smallIcon, iconClassName)} />

  return (
    <LWTooltip title="Shortform">
      <Link to={commentGetPageUrlFromIds({postId:post._id, postSlug:post.slug, commentId: comment._id})}>
        <ForumIcon icon="Shortform" className={classNames(classes.smallIcon, iconClassName)} />
      </Link>
    </LWTooltip>
  )
}

export default registerComponent(
  'CommentShortformIcon', CommentShortformIcon
);





