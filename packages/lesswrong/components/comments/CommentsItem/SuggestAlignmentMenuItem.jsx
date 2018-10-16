import React, { PureComponent } from 'react';
import { registerComponent, withMessages, Components, withUpdate } from 'meteor/vulcan:core';
import MenuItem from 'material-ui/MenuItem';
import PropTypes from 'prop-types';
// import { withApollo } from 'react-apollo'
import { Comments } from '../../../lib/collections/comments'

class SuggestAlignmentMenuItem extends PureComponent {

  render() {
    const { currentUser, comment, post, updateComment } = this.props

    const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

    if (!userHasSuggested) {
      return (
        <MenuItem
          onClick={() => Comments.suggestForAlignment({ currentUser, comment, updateComment })}
          primaryText="Suggest for Alignment"
        />
      )
    } else {
      return <MenuItem
        onClick={() => Comments.unSuggestForAlignment({ currentUser, comment, updateComment })}
        primaryText="Unsuggest for Alignment"
      />
    }
  }
}

const withUpdateOptions = {
  collection: Comments,
  fragmentName: 'SuggestAlignmentComment',
}

registerComponent(
  'SuggestAlignmentMenuItem',
   SuggestAlignmentMenuItem,
   [withUpdate, withUpdateOptions],
   withMessages,
   // withApollo,
);
export default SuggestAlignmentMenuItem;
