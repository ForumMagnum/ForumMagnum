import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useHover } from '../common/withHover';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginRight: 8,
    whiteSpace: "nowrap"
  },
  draft: {
    color: theme.palette.grey[400]
  },
  default: {
    color: theme.palette.grey[900],
  },
  titleDisplay: {
    display: "block"
  },
  scoreTitleFormat: {
    width: 20,
    display: "inline-block"
  }
})


const PostKarmaWithPreview = ({ post, classes, displayTitle }: {
  post: SunshinePostsList,
  classes: ClassesType,
  displayTitle: boolean
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const { LWPopper, PostsPreviewTooltip, MetaInfo } = Components

  return <span className={classNames(classes.root, {[classes.titleDisplay]: displayTitle})} {...eventHandlers}>
    <Link className={post.draft ? classes.draft : classes.default} to={postGetPageUrl(post)}>
      <span className={displayTitle ? classes.scoreTitleFormat : null}>
        {post.baseScore} 
      </span>
      {displayTitle && <MetaInfo>{post.title}</MetaInfo>}
    </Link>
    <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement={displayTitle ? "right-start" : "bottom-start"}
      >
      <div>
        <PostsPreviewTooltip post={post}/>
      </div>
    </LWPopper>
  </span>
}

const PostKarmaWithPreviewComponent = registerComponent('PostKarmaWithPreview', PostKarmaWithPreview, {styles});

declare global {
  interface ComponentTypes {
    PostKarmaWithPreview: typeof PostKarmaWithPreviewComponent
  }
}

