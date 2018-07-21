import { Components, replaceComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments } from "meteor/example-forum";

class CommentsList extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  render() {
    if (this.state.error) {
      return <div className="errorText">Error rendering comments list: {this.state.error}</div>
    }
    
    let {comments, currentUser, highlightDate, editMutation, post, frontPage} = this.props;
    if (comments) {
      return (
        <div className="comments-list">
          {comments.map(comment =>
            <Components.CommentsNode
              currentUser={currentUser}
              comment={comment}
              key={comment._id}
              highlightDate={highlightDate}
              editMutation={editMutation}
              post={post}
              frontPage={frontPage}
            />)
          }
        </div>
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
  
  componentDidCatch(error, info) {
    this.setState({error:error.toString()});
  }
}

CommentsList.displayName = "CommentsList";

const withEditOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
};


replaceComponent('CommentsList', CommentsList, [withEdit, withEditOptions]);
