import React, { PureComponent } from 'react';
import { registerComponent, withMessages, withCreate } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import withDialog from '../../common/withDialog'
import withUser from '../../common/withUser';

class ConvertToPostMenuItem extends PureComponent {

  createConvertedDraft = () => {
    const { createPost, comment } = this.props;

  }

  render() {
    return <MenuItem onClick={this.createConvertedDraft}>
      Convert to Post
    </MenuItem>
  }
}

registerComponent(
  'ConvertToPostMenuItem', ConvertToPostMenuItem, 
  [withCreate, {
    collection: Posts,
    fragmentName: 'newConversationFragment',
  }], 
  withMessages, 
  withUser);
