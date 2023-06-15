import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import * as _ from 'underscore';
import { forumTypeSetting, isEAForum } from '../../lib/instanceSettings';
import type { Option } from '../common/InlineSelect';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';

export const viewNames: Partial<Record<CommentsViewName,string>> = {
  'postCommentsMagic': isEAForum ? 'New & upvoted' : 'magic (new & upvoted)',
  'postCommentsTop': isEAForum ? 'Top' : 'top scoring',
  'postCommentsRecentReplies': preferredHeadingCase('latest reply'),
  'afPostCommentsTop': preferredHeadingCase('top scoring'),
  'postCommentsNew': isEAForum ? 'New' : 'newest',
  'postCommentsOld': isEAForum ? 'Old' : 'oldest',
  'postCommentsBest': preferredHeadingCase('highest karma'),
  'postCommentsDeleted': preferredHeadingCase('deleted'),
  'postLWComments': preferredHeadingCase('top scoring (include LW)'),
}

const CommentsViews = ({post, classes}: {
  post?: PostsDetails,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;

  const {InlineSelect} = Components

  const handleViewClick = (opt: Option & {value: CommentsViewName}) => {
    const view = opt.value
    const { query } = location;
    const currentQuery = _.isEmpty(query) ? {view: 'postCommentsTop'} : query
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  const commentsTopView: CommentsViewName = forumTypeSetting.get() === 'AlignmentForum' ? "afPostCommentsTop" : "postCommentsTop"
  let views: Array<CommentsViewName> = ["postCommentsMagic", commentsTopView, "postCommentsNew", "postCommentsOld", "postCommentsRecentReplies"]
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

  return <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleViewClick}/>

};

const CommentsViewsComponent = registerComponent('CommentsViews', CommentsViews);

declare global {
  interface ComponentTypes {
    CommentsViews: typeof CommentsViewsComponent,
  }
}

