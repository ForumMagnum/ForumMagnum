import React, { useState, useCallback } from 'react'
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import HistoryIcon from '@material-ui/icons/History';
import moment from '../../../lib/moment-timezone';
import PostsRevisionsList from "@/components/posts/PostsPage/PostsRevisionsList";
import { Menu, Tooltip } from "@/components/mui-replacement";

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

const PostsRevisionSelector = ({ post, format, classes }: {
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
  const tooltip = anchorEl ? null : <span>
    This post has major past revisions. Click to view. <br/>
    <em>Originally published: {moment(new Date(post.postedAt)).format("LLL z")}</em>
  </span>
  return <React.Fragment>
    <Tooltip title={tooltip}>
      <span onClick={openMenu} className={classes.button}>
        <HistoryIcon className={classes.icon}/>
        <span>{ format ? 
          moment(new Date(post.postedAt)).format(format) :
          moment(new Date(post.postedAt)).fromNow()
        }</span>
      </span>
    </Tooltip>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={closeMenu}
    >
      <PostsRevisionsList post={post}/>
    </Menu>
  </React.Fragment>
}

const PostsRevisionSelectorComponent = registerComponent('PostsRevisionSelector', PostsRevisionSelector, {styles});

declare global {
  interface ComponentTypes {
    PostsRevisionSelector: typeof PostsRevisionSelectorComponent
  }
}

export default PostsRevisionSelectorComponent;
