import React from 'react';
import { registerComponent, useMulti } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';

import withDialog from '../common/withDialog';
import withUser from '../common/withUser';
import { Posts } from "../../lib/collections/posts";
import { Comments } from "../../lib/collections/comments";
import { useNavigation } from '../../lib/routeUtil';
import qs from 'qs'

const NominatePostMenuItem = ({ currentUser, post, onClose, openDialog}) => {
  const { history } = useNavigation();

  const { results: nominations = [], loading } = useMulti({
    terms: {
      view:"nominations2018", 
      postId: post._id, 
      nominatedForReview: "2018", 
      userId: currentUser._id
    },
    collection: Comments,
    queryName: "userNominations",
    fragmentName: "CommentsList"
  });

  if (currentUser.karma < 1000) return null
  if (new Date(post.postedAt) > new Date("2019-01-01")) return null

  const nominated = !loading && nominations?.length;

  const tooltip = nominated ?
      <div>
        <div>You have already nominated this post. </div>
        <div><em>(Click to review or edit your endorsement)</em></div>
      </div>
    :
    "Write an endorsement for the 2018 Review."

  const handleClick = () => {
    if (nominated) {
      history.push({pathname: Posts.getPageUrl(post), search: `?${qs.stringify({commentId: nominations[0]._id})}`});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      openDialog({
        componentName:"NominatePostDialog",
        componentProps: {post}
      })
    }
  }
  
  return (<React.Fragment>
      <Tooltip title={tooltip} placement="left">
        <MenuItem onClick={handleClick}>
          <ListItemIcon>
            { nominated ? <StarIcon /> : <StarBorderIcon /> }
          </ListItemIcon>
          {nominated ? "View Nomination" : "Nominate Post"}
        </MenuItem>
      </Tooltip>
      <Divider/>
    </React.Fragment>
  );
}

registerComponent('NominatePostMenuItem', NominatePostMenuItem, withDialog, withUser);
