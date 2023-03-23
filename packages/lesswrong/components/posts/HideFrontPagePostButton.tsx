import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import { useTracking } from '../../lib/analyticsEvents';
import { useMutation, gql } from '@apollo/client';
import map from 'lodash/map';
import reject from 'lodash/reject'
import some from 'lodash/some'


const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  }
})

const HideFrontPagePostButton = ({post}: {
  post: PostsBase,
}) => {

  const currentUser = useCurrentUser()
  const [hidden, setHiddenState] = useState(map((currentUser?.hiddenPostsMetadata || []), 'postId')?.includes(post._id))
  const { captureEvent } = useTracking()
  const { MenuItem } = Components;

  const [setIsHiddenMutation] = useMutation(gql`
    mutation setIsHidden($postId: String!, $isHidden: Boolean!) {
      setIsHidden(postId: $postId, isHidden: $isHidden) {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery("UsersCurrent")}
  `);

  if (!currentUser) {
    return null;
  }

  const toggleShown = (event: React.MouseEvent) => {
    const isHidden = !hidden;
    setHiddenState(isHidden)

    // FIXME: this mutation logic is duplicated from the mutation - ideally we'd like to have a single implementation,
    // but there wasn't an obvious place to share this logic. 
    const oldHiddenList = currentUser.hiddenPostsMetadata || [];
    let newHiddenList:Array<{postId:string}>;

    if (isHidden) {
      const alreadyHidden = some(oldHiddenList, hiddenMetadata => hiddenMetadata.postId == post._id)
      if (alreadyHidden) {
        newHiddenList = oldHiddenList;
      } else {
        newHiddenList = [...oldHiddenList, {postId: post._id}]
      }
    } else {
        newHiddenList = reject(oldHiddenList, hiddenMetadata=>hiddenMetadata.postId===post._id)
    }

    void setIsHiddenMutation({
      variables: {postId: post._id, isHidden},
      optimisticResponse: {
        setIsHidden: {
          ...currentUser,
          hiddenPostsMetadata: newHiddenList
        }
      }
    });

    captureEvent("hideToggle", {"postId": post._id, "hidden": isHidden})
  }

  const icon = hidden ? <VisibilityOff/> : <Visibility/>
  const title = hidden ? "Un-hide from frontpage" : "Hide from frontpage" // named to be consistent with bookmark / un-bookmark

  return (
    <MenuItem onClick={toggleShown}>
      <ListItemIcon>
        { icon }
      </ListItemIcon>
      {title}
    </MenuItem>
  )
}

const HideFrontPageButtonComponent = registerComponent('HideFrontPagePostButton', HideFrontPagePostButton, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    HideFrontPagePostButton: typeof HideFrontPageButtonComponent
  }
}
