import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withHover from '../common/withHover';
import { KARMA_WIDTH } from './PostsItem2';

const styles = theme => ({
  root: {
    display: "flex",
    marginBottom: 2,
  },
  karma: {
    width: KARMA_WIDTH
  }
});

interface ExternalProps {
  post: any,
}
interface PingbackProps extends WithStylesProps, WithHoverProps {
}

const Pingback = ({classes, post, hover, anchorEl, stopHover}) => {
  const { LWPopper, PostsItem2MetaInfo, PostsItemKarma, PostsTitle, PostsPreviewTooltip } = Components

  return <div className={classes.root}>
      <LWPopper 
        open={hover} 
        anchorEl={anchorEl} 
        placement="bottom-end"
        modifiers={{
          flip: {
            behavior: ["bottom-end", "top", "bottom-end"],
            boundariesElement: 'viewport'
          } 
        }}
      >
        <PostsPreviewTooltip post={post}/>
      </LWPopper>
      <PostsItem2MetaInfo className={classes.karma}>
        <PostsItemKarma post={post} />
      </PostsItem2MetaInfo>
      <PostsTitle post={post} read={post.lastVisitedAt} showIcons={false}/>
  </div>
}

const PingbackComponent = registerComponent<ExternalProps>("Pingback", Pingback, {
  styles,
  hocs: [withHover()]
});

declare global {
  interface ComponentTypes {
    Pingback: typeof PingbackComponent
  }
}

