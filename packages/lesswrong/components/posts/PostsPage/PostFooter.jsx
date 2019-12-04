import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { userHasPingbacks, userHasTagging } from '../../../lib/betas.js';
import { useCurrentUser } from '../../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../../lib/modules/utils/theme';
import Tooltip from '@material-ui/core/Tooltip';

const MAX_COLUMN_WIDTH = 720

const styles = theme => ({
  root: {
    position: "relative",
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
  
  twoColumn: {
    position: "relative",
  },
  leftColumn: {
    width: 300,
    display: "inline-block",
  },
  divider: {
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    width: "0px",
    borderLeftStyle: "solid",
    borderLeftWidth: "1px",
    color: "rgba(0,0,0,0.3)",
    left: 0,
    right: 0,
    top: 10,
    bottom: 35,

    [legacyBreakpoints.maxSmall]: {
      display: "none"
    }
  },
  rightColumn: {
    float: "right",
    width: 300,
    display: "inline-block",
  },
  listHeader: {
    fontSize: "1.2rem",
    marginBottom: ".5em",
    fontWeight: 600,
  },
  clear: {
    clear: "both"
  },
});

const PostFooter = ({post, sequenceId, classes}) => {
  const { BottomNavigation, PingbacksList, FooterTagList } = Components;
  const currentUser = useCurrentUser();
  
  return <div className={classes.root}>
    {sequenceId && <div className={classes.bottomNavigation}>
      <BottomNavigation post={post}/>
    </div>}
    
    <div className={classes.twoColumn}>
      {userHasPingbacks(currentUser) &&
        <div className={classes.leftColumn}>
          <div className={classes.listHeader}>
            <Tooltip title="Posts that linked to this post" placement="right">
              <span>Pingbacks:</span>
            </Tooltip>
          </div>
          <PingbacksList postId={post._id}/>
        </div>}
      
      <div className={classes.divider}/>
      
      {userHasTagging(currentUser) &&
        <div className={classes.rightColumn}>
          <div className={classes.listHeader}>
            <Tooltip title="Tags that are relevant to this post" placement="right">
              <span>Tags:</span>
            </Tooltip>
          </div>
          <FooterTagList post={post}/>
        </div>}
      
      <div className={classes.clear}></div>
    </div>
  </div>
}

registerComponent("PostFooter", PostFooter,
  withStyles(styles, {name: "PostFooter"}));

