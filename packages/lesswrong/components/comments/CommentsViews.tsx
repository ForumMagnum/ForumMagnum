import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import { isEmpty } from 'underscore';
import type { Option } from '../common/InlineSelect';
import { getCommentViewOptions } from '../../lib/commentViewOptions';

const CommentsViews = ({post}: {post?: PostsDetails}) => {
  const currentUser = useCurrentUser();
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;

  const {InlineSelect} = Components

  const handleViewClick = (opt: Option & {value: CommentsViewName}) => {
    const view = opt.value
    const { query } = location;
    const currentQuery = isEmpty(query) ? {view: 'postCommentsTop'} : query
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined}
    history.push({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  const currentView: string = query?.view || commentGetDefaultView(post||null, currentUser)
  const includeAdminViews = userCanDo(currentUser, "comments.softRemove.all");
  const viewOptions = getCommentViewOptions({includeAdminViews});
  const selectedOption = viewOptions.find((option) => option.value === currentView) || viewOptions[0]

  return <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleViewClick}/>

};

const CommentsViewsComponent = registerComponent('CommentsViews', CommentsViews);

declare global {
  interface ComponentTypes {
    CommentsViews: typeof CommentsViewsComponent,
  }
}
