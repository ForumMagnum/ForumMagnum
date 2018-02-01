import { Components, replaceComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import muiThemeable from 'material-ui/styles/muiThemeable';

const KARMA_COLLAPSE_THRESHOLD = -4;

class CommentsNode extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      collapsed: props && props.comment && props.comment.baseScore < KARMA_COLLAPSE_THRESHOLD
    };
  }

  toggleCollapse = () => {
    this.setState({collapsed: !this.state.collapsed});
  }

  toggleHover = () => {
    this.setState({hover: !this.state.hover});
  }

  render() {
    const {comment, currentUser, highlightDate, editMutation, postEditMutation, post, muiTheme } = this.props;

    const newComment = highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime())
    const borderColor = this.state.hover ? muiTheme && muiTheme.palette.accent2Color : muiTheme && muiTheme.palette.accent1Color

    const nodeClass = classNames("comments-node", {
      "comments-node-root" : comment.level === 1,
      "comments-node-even" : comment.level % 2 === 0,
      "comments-node-odd"  : comment.level % 2 != 0
    })

    return (
      <div className={newComment ? "comment-new" : "comment-old"}>
        <div className={nodeClass}
          onMouseEnter={this.toggleHover}
          onMouseLeave={this.toggleHover}
          style={newComment ? {borderLeft:"solid 5px " + borderColor} : {}}>

          <Components.CommentsItem
            collapsed={this.state.collapsed}
            toggleCollapse={this.toggleCollapse}
            currentUser={currentUser}
            comment={comment}
            key={comment._id}
            editMutation={editMutation}
            postEditMutation={postEditMutation}
            post={post}
          />
          {!this.state.collapsed && comment.childrenResults ?
            <div className="comments-children">

              {comment.childrenResults.map(comment =>
                <CommentsNode currentUser={currentUser}
                  comment={comment}
                  key={comment._id}
                  muiTheme={muiTheme}
                  highlightDate={highlightDate}
                  editMutation={editMutation}
                  postEditMutation={postEditMutation}
                  post={post}
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

replaceComponent('CommentsNode', CommentsNode, muiThemeable());
