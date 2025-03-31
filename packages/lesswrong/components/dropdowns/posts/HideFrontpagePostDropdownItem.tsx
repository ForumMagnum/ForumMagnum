import React, { useState, useContext } from 'react';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { AllowHidingFrontPagePostsContext, IsRecommendationContext } from './PostActions';
import withErrorBoundary from '../../common/withErrorBoundary';
import map from 'lodash/map';
import { useDialog } from '../../common/withDialog';
import { useSetIsHiddenMutation } from './useSetIsHidden';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
});

const HideFrontpagePostDropdownItem = ({post}: {post: PostsBase}) => {
  const allowHidingPosts = useContext(AllowHidingFrontPagePostsContext)
  const isRecommendation = useContext(IsRecommendationContext)
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog()
  const [hidden, setHiddenState] = useState(map((currentUser?.hiddenPostsMetadata || []), 'postId')?.includes(post._id));
  const {captureEvent} = useTracking();

  const { setIsHiddenMutation } = useSetIsHiddenMutation();

  // We do not show post hiding from frontpage and 'dislike recommendation' as the latter includes the former. See DislikeRecommendationDropdownItem.tsx
  if (!allowHidingPosts || isRecommendation) {
    return null;
  }

  const toggleShown = () => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      });
      return;
    }

    const isHidden = !hidden;
    setHiddenState(isHidden);

    void setIsHiddenMutation({postId: post._id, isHidden})
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

const HideFrontpagePostDropdownItemComponent = registerComponent(
  'HideFrontpagePostDropdownItem', HideFrontpagePostDropdownItem,
  {
    styles,
    hocs: [withErrorBoundary],
  },
);

declare global {
  interface ComponentTypes {
    HideFrontpagePostDropdownItem: typeof HideFrontpagePostDropdownItemComponent
  }
}
