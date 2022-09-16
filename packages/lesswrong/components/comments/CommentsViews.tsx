import { registerComponent } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';

export const viewNames: Partial<Record<CommentsViewName,string>> = {
  'postCommentsTop': 'top scoring',
  'afPostCommentsTop': 'top scoring',
  'postCommentsNew': 'newest',
  'postCommentsOld': 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postLWComments': 'top scoring (include LW)',
}

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'inline'
  },
  link: {
    color: theme.palette.lwTertiary.main,
  }
})

const CommentsViews = ({post, classes}: {
  post?: PostsDetails,
  classes: ClassesType,
}) => {
  const [anchorEl,setAnchorEl] = useState<any>(null);
  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;

  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleViewClick = (view: string) => {
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? {view: 'postCommentsTop'} : query
    setAnchorEl(null);
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  const handleClose = () => {
    setAnchorEl(null);
  }

  const commentsTopView: CommentsViewName = forumTypeSetting.get() === 'AlignmentForum' ? "afPostCommentsTop" : "postCommentsTop"
  let views: Array<CommentsViewName> = [commentsTopView, "postCommentsNew", "postCommentsOld"]
  const adminViews: Array<CommentsViewName> = ["postCommentsDeleted"]
  const afViews: Array<CommentsViewName> = ["postLWComments"]
  const currentView: string = query?.view || commentGetDefaultView(post||null, currentUser)

  if (userCanDo(currentUser, "comments.softRemove.all")) {
    views = views.concat(adminViews);
  }

  const af = forumTypeSetting.get() === 'AlignmentForum'
  if (af) {
    views = views.concat(afViews);
  }

  return <SelectSorting options={views} selected={currentView} handleSelect={handleViewClick}/>
  return <div className={classes.root}>
    <a className={classes.link} onClick={handleClick}>
      {viewNames[currentView]}
    </a>
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleClose}
    >
      {views.map((view: string) => {
        return <MenuItem key={view} onClick={() => handleViewClick(view)} >
          {viewNames[view]}
        </MenuItem>
      })}
    </Menu>
  </div>
};

const CommentsViewsComponent = registerComponent('CommentsViews', CommentsViews, {styles});

declare global {
  interface ComponentTypes {
    CommentsViews: typeof CommentsViewsComponent,
  }
}

