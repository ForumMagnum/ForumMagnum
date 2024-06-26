import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { commentGetDefaultView } from '../../lib/collections/comments/helpers'
import { useCurrentUser } from '../common/withUser';
import qs from 'qs'
import { isEmpty } from 'underscore';
import type { Option } from '../common/InlineSelect';
import { getCommentViewOptions } from '../../lib/commentViewOptions';
import { useNavigate } from '../../lib/reactRouterWrapper';

const CommentsViews = ({post, setRestoreScrollPos}: {post?: PostsDetails, setRestoreScrollPos?: (pos: number) => void}) => {
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;

  const {InlineSelect} = Components

  // permalinkedCommentHeight() finds the height of the comment at the top of comment permalink pages
  // on the EA Forum and LessWrong. This is used when the user changes the comment sort order, which
  // changes the page from a comment permalink page to a regular post page, and we want to preserve
  // the user's (apparent) scroll position. With that top comment removed, we need to scroll up by its
  // height.
  // (If there is no permalinked comment at the top, whether because we're in a regular post page or
  // because we're on Waking Up, which doesn't put permalinked comments at the top, this function
  // returns zero.)
  const permalinkedCommentHeight = () => {
    const commentHeight = document.querySelector('.CommentPermalink-root')?.scrollHeight || 0;
    const dividerEl = document.querySelector('.CommentPermalink-dividerMargins');
    const dividerMarginBottom = dividerEl ? parseInt(getComputedStyle(dividerEl).marginBottom) : 0;
    return commentHeight + dividerMarginBottom;
  }

  const handleViewClick = (opt: Option & {value: CommentsViewName}) => {
    const view = opt.value
    const { query } = location;
    const currentQuery = isEmpty(query) ? {view: 'postCommentsTop'} : query
    const newQuery = {...currentQuery, view: view, postId: post ? post._id : undefined, commentId: undefined}
    setRestoreScrollPos?.(window.scrollY - permalinkedCommentHeight());
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`})
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
