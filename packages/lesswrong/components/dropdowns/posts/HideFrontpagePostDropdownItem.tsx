import React, { useState, useContext } from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { useMutation, gql } from '@apollo/client';
import { AllowHidingFrontPagePostsContext } from '../../posts/PostsPage/PostActions';
import withErrorBoundary from '../../common/withErrorBoundary';
import map from 'lodash/map';
import reject from 'lodash/reject';
import some from 'lodash/some';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
});

const HideFrontpagePostDropdownItem = ({post}: {post: PostsBase}) => {
  const allowHidingPosts = useContext(AllowHidingFrontPagePostsContext)
  const currentUser = useCurrentUser();
  const [hidden, setHiddenState] = useState(map((currentUser?.hiddenPostsMetadata || []), 'postId')?.includes(post._id));
  const {captureEvent} = useTracking();

  const [setIsHiddenMutation] = useMutation(gql`
    mutation setIsHidden($postId: String!, $isHidden: Boolean!) {
      setIsHidden(postId: $postId, isHidden: $isHidden) {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery("UsersCurrent")}
  `);

  if (!currentUser || !allowHidingPosts) {
    return null;
  }

  const toggleShown = () => {
    const isHidden = !hidden;
    setHiddenState(isHidden);

    // FIXME: this mutation logic is duplicated from the mutation - ideally we'd
    // like to have a single implementation, but there wasn't an obvious place to
    // share this logic.
    const oldHiddenList = currentUser.hiddenPostsMetadata || [];
    let newHiddenList:Array<{postId:string}>;

    if (isHidden) {
      const alreadyHidden = some(
        oldHiddenList,
        (hiddenMetadata) => hiddenMetadata.postId == post._id,
      );
      newHiddenList = alreadyHidden
        ? oldHiddenList
        : [...oldHiddenList, {postId: post._id}];
    } else {
      newHiddenList = reject(
        oldHiddenList,
        (hiddenMetadata) => hiddenMetadata.postId === post._id,
      );
    }

    void setIsHiddenMutation({
      variables: {postId: post._id, isHidden},
      optimisticResponse: {
        setIsHidden: {
          ...currentUser,
          hiddenPostsMetadata: newHiddenList,
        },
      },
    });

    captureEvent("hideToggle", {"postId": post._id, "hidden": isHidden});
  }

  // Named to be consistent with bookmark / un-bookmark
  const title = hidden ? "Un-hide from frontpage" : "Hide from frontpage";
  const icon = hidden ? "EyeOutline" : "Eye";

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={title}
      onClick={toggleShown}
      icon={icon}
    />
  );
}

const HideFrontPageButtonComponent = registerComponent(
  'HideFrontpagePostDropdownItem',
  HideFrontpagePostDropdownItem,
  {
    styles,
    hocs: [withErrorBoundary],
  },
);

declare global {
  interface ComponentTypes {
    HideFrontpagePostDropdownItem: typeof HideFrontPageButtonComponent
  }
}
