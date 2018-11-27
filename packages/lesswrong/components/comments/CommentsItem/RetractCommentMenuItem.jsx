import React, { PureComponent } from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withUser from '../../common/withUser';
import { getFragment } from 'meteor/vulcan:core';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import MenuItem from '@material-ui/core/MenuItem';

function withRetractComment(options)
{
  const fragmentName = "CommentsList";
  const fragment = getFragment(fragmentName);
  
  return graphql(gql`
    mutation retractComment($commentId: String, $retracted: Boolean) {
      retractComment(commentId: $commentId, retracted: $retracted) {
        ...${fragmentName}
      }
    }
    ${fragment}
  `, {
    alias: 'withRetractComment',
    props: ({ ownProps, mutate }) => ({
      retractCommentMutation: (args) => {
        const { commentId, retracted } = args;
        return mutate({
          variables: { commentId, retracted }
        });
      }
    }),
  });
}

class RetractCommentMenuItem extends PureComponent
{
  handleRetract = (event) => {
    const { retractCommentMutation, comment } = this.props;
    retractCommentMutation({
      commentId: comment._id,
      retracted: true,
    });
  }
  
  handleUnretract = (event) => {
    const { retractCommentMutation, comment } = this.props;
    retractCommentMutation({
      commentId: comment._id,
      retracted: false,
    });
  }
  
  render() {
    const { currentUser, comment } = this.props;
    
    if (!currentUser || comment.userId != currentUser._id)
      return null;
    
    if (comment.retracted) {
      return <MenuItem onClick={this.handleUnretract}>Unretract Comment</MenuItem>
    } else {
      return <MenuItem onClick={this.handleRetract}>Retract Comment</MenuItem>
    }
  }
}

registerComponent('RetractCommentMenuItem', RetractCommentMenuItem,
  withUser, [withRetractComment, {}]);
