import React, { useState, useCallback } from 'react'
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import HistoryIcon from '@/lib/vendor/@material-ui/icons/src/History';
import { Menu } from '@/components/widgets/Menu';
import moment from '../../../lib/moment-timezone';
import { TooltipSpan } from '@/components/common/FMTooltip';


const styles = (theme: ThemeType) => ({
  icon: {
    verticalAlign: 'text-top',
    fontSize: 'inherit',
    marginRight: 4,
    position: 'relative',
    top: 3
  },
  button: {
    cursor: 'pointer'
  }
})

const PostsRevisionSelectorInner = ({ post, format, classes }: {
  post: PostsBase,
  format: string,
  classes: ClassesType<typeof styles>,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement|null>(null);
  
  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }, [setAnchorEl]);
  const closeMenu = useCallback(() => {
    setAnchorEl(null);
  }, [setAnchorEl]);
  
  const { PostsRevisionsList } = Components
  const tooltip = anchorEl ? null : <span>
    This post has major past revisions. Click to view. <br/>
    <em>Originally published: {moment(new Date(post.postedAt)).format("LLL z")}</em>
  </span>
  return <React.Fragment>
    <TooltipSpan title={tooltip}>
      <span onClick={openMenu} className={classes.button}>
        <HistoryIcon className={classes.icon}/>
        <span>{ format ? 
          moment(new Date(post.postedAt)).format(format) :
          moment(new Date(post.postedAt)).fromNow()
        }</span>
      </span>
    </TooltipSpan>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={closeMenu}
    >
      <PostsRevisionsList post={post}/>
    </Menu>
  </React.Fragment>
}

export const PostsRevisionSelector = registerComponent('PostsRevisionSelector', PostsRevisionSelectorInner, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionSelector: typeof PostsRevisionSelector
  }
}
