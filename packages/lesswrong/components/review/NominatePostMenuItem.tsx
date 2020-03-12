import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Divider from '@material-ui/core/Divider';
import Tooltip from '@material-ui/core/Tooltip';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';

import { useDialog } from '../common/withDialog';
import { useCurrentUser } from '../common/withUser';
import { Posts } from "../../lib/collections/posts";
import { Comments } from "../../lib/collections/comments";
import { useNavigation } from '../../lib/routeUtil';
import qs from 'qs'

const NominatePostMenuItem = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { history } = useNavigation();

  const { results: nominations = [], loading } = useMulti({
    skip: !currentUser,
    terms: {
      view:"nominations2018", 
      postId: post._id, 
      userId: currentUser?._id
    },
    collection: Comments,
    fragmentName: "CommentsList"
  });

  if (!currentUser) return null;
  if (post.userId === currentUser!._id) return null
  if ((currentUser.karma||0) < 1000) return null
  if (new Date(post.postedAt) > new Date("2019-01-01")) return null
  if (new Date(post.postedAt) < new Date("2018-01-01")) return null

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

const NominatePostMenuItemComponent = registerComponent('NominatePostMenuItem', NominatePostMenuItem);

declare global {
  interface ComponentTypes {
    NominatePostMenuItem: typeof NominatePostMenuItemComponent
  }
}

