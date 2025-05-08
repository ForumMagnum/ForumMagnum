import React, { useState, useContext } from 'react';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { AllowHidingFrontPagePostsContext, IsRecommendationContext } from './PostActions';
import withErrorBoundary from '../../common/withErrorBoundary';
import map from 'lodash/map';
import { useDialog } from '../../common/withDialog';
import { useSetIsHiddenMutation } from './useSetIsHidden';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../../lib/vulcan-lib/fragments";
import { LoginPopup } from "../../users/LoginPopup";
import { DropdownItem } from "../DropdownItem";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
});

const HideFrontpagePostDropdownItemInner = ({post}: {post: PostsBase}) => {
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
        name: "LoginPopup",
        contents: ({onClose}) => <LoginPopup onClose={onClose} />
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
  return (
    <DropdownItem
      title={title}
      onClick={toggleShown}
      icon={icon}
    />
  );
}

export const HideFrontPageButton = registerComponent(
  'HideFrontpagePostDropdownItem',
  HideFrontpagePostDropdownItemInner,
  {
    styles,
    hocs: [withErrorBoundary],
  },
);

declare global {
  interface ComponentTypes {
    HideFrontpagePostDropdownItem: typeof HideFrontPageButton
  }
}
