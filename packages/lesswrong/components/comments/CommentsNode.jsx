import { Components, replaceComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

class CommentsNode extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      collapsed: false
    };
  }

  toggleCollapse = () => {
    this.setState({collapsed: !this.state.collapsed});
  }

  render() {
    const {comment, currentUser, newComment, editMutation} = this.props;
    return (
      <div className={newComment ? "comment-new" : "comment-old"}>
        <div className={"comments-node"}>
          <Components.CommentsItem
            collapsed={this.state.collapsed}
            toggleCollapse={this.toggleCollapse}
            currentUser={currentUser}
            comment={comment}
            key={comment._id}
            editMutation={editMutation}
          />
        {!this.state.collapsed && comment.childrenResults ?
            <div className="comments-children">
              {comment.childrenResults.map(comment =>
                <CommentsNode currentUser={currentUser}
                  comment={comment}
                  key={comment._id}
                  newComment={newComment}
                  editMutation={editMutation}
                />)}
            </div>
            : null
          }
        </div>
      </div>
    )
  }
}

CommentsNode.propTypes = {
  comment: PropTypes.object.isRequired, // the current comment
};

replaceComponent('CommentsNode', CommentsNode);
