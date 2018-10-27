import React, { PureComponent } from 'react';
import { registerComponent, Components, withUpdate } from 'meteor/vulcan:core';
import MenuItem from 'material-ui/MenuItem';
import PropTypes from 'prop-types';
import { Comments } from '../../../lib/collections/comments'

class SuggestAlignmentMenuItem extends PureComponent {

  render() {
    const { currentUser, comment, updateComment } = this.props

    const userHasSuggested = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser._id)

    if (!userHasSuggested) {
      return (
        <MenuItem onClick={() => Comments.suggestForAlignment({ currentUser, comment, updateComment })}>
          Suggest for Alignment
        </MenuItem>
      )
    } else {
      return <MenuItem onClick={() => Comments.unSuggestForAlignment({ currentUser, comment, updateComment })}>
          Unsuggest for Alignment
        </MenuItem>
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
);
export default SuggestAlignmentMenuItem;
