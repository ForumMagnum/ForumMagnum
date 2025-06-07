import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import PostsTooltip from "../posts/PostsPreviewTooltip/PostsTooltip";
import FormatDate from "../common/FormatDate";

const styles = (theme: ThemeType) => ({
  root: {
    marginRight: 8,
    whiteSpace: "nowrap"
  },
  draft: {
    opacity: .6,
    '&&': {
      fontWeight: 400
    }
  },
  default: {
    color: theme.palette.grey[900],
  },
  titleDisplay: {
    display: "block"
  },
  scoreTitleFormat: {
    width: 30,
    marginRight: 8,
    display: "inline-block",
    textAlign: "center"
  },
  highlight: {
    color: theme.palette.primary.main,
    fontWeight: 600
  }
})

const PostKarmaWithPreview = ({ post, classes, displayTitle, reviewedAt }: {
  post: SunshinePostsList,
  classes: ClassesType<typeof styles>,
  displayTitle: boolean,
  reviewedAt?: Date
}) => {
  return (
    <PostsTooltip
      post={post}
      placement={displayTitle ? "right-start" : "bottom-start"}
      clickable
    >
      <span className={classNames(classes.root, {
        [classes.titleDisplay]: displayTitle,
      })}>
        <Link
          className={classNames({
            [classes.highlight]: !reviewedAt || new Date(post.postedAt) > reviewedAt,
            [classes.draft]: post.draft,
            [classes.default]: !post.draft,
          })}
          to={postGetPageUrl(post)}
        >
          {displayTitle && <span className={classes.scoreTitleFormat}>
            <FormatDate date={post.postedAt} />
          </span>}
          <span className={displayTitle ? classes.scoreTitleFormat : undefined}>
            {post.baseScore}
          </span>
          {displayTitle && post.title}
        </Link>
      </span>
    </PostsTooltip>
  );
}

export default registerComponent('PostKarmaWithPreview', PostKarmaWithPreview, {styles});


