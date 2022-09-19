import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import * as _ from 'underscore';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Option } from '../common/SelectSorting';

export const viewNames: Partial<Record<CommentsViewName,string>> = {
  'postCommentsTop': 'top scoring',
  'afPostCommentsTop': 'top scoring',
  'postCommentsNew': 'newest',
  'postCommentsOld': 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postLWComments': 'top scoring (include LW)',
}

const CommentsViews = ({post, classes}: {
  post?: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;

  const {SelectSorting} = Components

  const handleViewClick = (opt: Option) => {
    const view = opt.value as CommentsViewName
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? {view: 'postCommentsTop'} : query
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

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

  const viewOptions: Array<Option> = views.map((view) => {
    return {value: view, label: viewNames[view] || view}
  })
  const selectedOption = viewOptions.find((option) => option.value === currentView) || viewOptions[0]

  return <SelectSorting options={viewOptions} selected={selectedOption} handleSelect={handleViewClick}/>

};

const CommentsViewsComponent = registerComponent('CommentsViews', CommentsViews);

declare global {
  interface ComponentTypes {
    CommentsViews: typeof CommentsViewsComponent,
  }
}

