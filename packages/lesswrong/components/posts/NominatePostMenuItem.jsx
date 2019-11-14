import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Divider from '@material-ui/core/Divider';
import StarIcon from '@material-ui/icons/Star';
import withDialog from '../common/withDialog'
import withUser from '../common/withUser'

const NominatePostMenuItem = ({post, onClose, openDialog}) => {

  

  return (<React.Fragment>
      <MenuItem onClick={()=>openDialog({
        componentName:"NominatePostDialog",
        componentProps: {post}
      })}>
        <ListItemIcon>
          <StarIcon />
        </ListItemIcon>
        Nominate Post
      </MenuItem>
      <Divider/>
    </React.Fragment>
  );
}

registerComponent('NominatePostMenuItem', NominatePostMenuItem, withDialog, withUser);
