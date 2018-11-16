import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments } from "../../lib/collections/comments";
import { shallowEqual, shallowEqualExcept } from '../../lib/modules/utils/componentUtils';
import { Posts } from '../../lib/collections/posts';

class CommentsList extends Component {
  constructor(props, context) {
    super(props)
  }

  shouldComponentUpdate(nextProps, nextState) {
    if(!shallowEqual(this.state, nextState))
      return true;
    if(!shallowEqualExcept(this.props, nextProps, ["post","comments","editMutation"]))
      return true;
    if(this.props.post==null || nextProps.post==null || this.props.post._id != nextProps.post._id)
      return true;
    if(this.commentTreesDiffer(this.props.comments, nextProps.comments))
      return true;
    return false;
  }

  commentTreesDiffer(oldComments, newComments) {
    if(oldComments===null && newComments!==null) return true;
    if(oldComments!==null && newComments===null) return true;
    if(newComments===null) return false;

    if(oldComments.length != newComments.length)
      return true;
    for(let i=0; i<oldComments.length; i++) {
      if(oldComments[i].item != newComments[i].item)
        return true;
      if(this.commentTreesDiffer(oldComments[i].children, newComments[i].children))
        return true;
    }
    return false;
  }

  render() {
    let {
      comments,
      currentUser,
      highlightDate,
      editMutation,
      post,
      postPage,
      totalComments,
      startThreadCollapsed,
    } = this.props;


    const { lastVisitedAt } = post
    const lastCommentedAt = Posts.getLastCommentedAt(post)
    const unreadComments = lastVisitedAt < lastCommentedAt;

    if (comments) {
      return (
        <Components.ErrorBoundary>
          <div className="comments-list">
            {comments.map(comment =>
              <Components.CommentsNode
                startThreadCollapsed={startThreadCollapsed || totalComments >= 25}
                unreadComments={unreadComments}
                currentUser={currentUser}
                comment={comment.item}
                nestingLevel={1}
                //eslint-disable-next-line react/no-children-prop
                children={comment.children}
                key={comment.item._id}
                highlightDate={highlightDate}
                editMutation={editMutation}
                post={post}
                postPage={postPage}
              />)
            }
          </div>
        </Components.ErrorBoundary>
      )
    } else {
      return (
        <div className="comments-list">
          <p>
            <FormattedMessage id="comments.no_comments"/>
          </p>
        </div>
      )
    }
  }
}


CommentsList.displayName = "CommentsList";

const withEditOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
};


registerComponent('CommentsList', CommentsList, [withEdit, withEditOptions]);
