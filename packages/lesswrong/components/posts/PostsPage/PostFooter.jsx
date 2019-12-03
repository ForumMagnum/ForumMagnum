import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { userHasPingbacks, userHasTagging } from '../../../lib/betas.js';
import { useCurrentUser } from '../../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const MAX_COLUMN_WIDTH = 720

const styles = theme => ({
  root: {
    maxWidth: 650 + (theme.spacing.unit*4),
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  bottomNavigation: {
    width: 640,
    margin: 'auto',
    [theme.breakpoints.down('sm')]: {
      width:'100%',
      maxWidth: MAX_COLUMN_WIDTH
    }
  },
});

const PostFooter = ({post, sequenceId, classes}) => {
  const { BottomNavigation, PingbacksList, FooterTagList } = Components;
  const currentUser = useCurrentUser();
  
  return <div className={classes.root}>
    {sequenceId && <div className={classes.bottomNavigation}>
      <BottomNavigation post={post}/>
    </div>}
    
    {userHasPingbacks(currentUser) &&
      <PingbacksList postId={post._id}/>}
    
    {userHasTagging(currentUser) &&
      <FooterTagList post={post}/>}
  </div>
}

registerComponent("PostFooter", PostFooter,
  withStyles(styles, {name: "PostFooter"}));

