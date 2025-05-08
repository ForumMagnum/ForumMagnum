import React, { useContext } from 'react';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';
import { IsRecommendationContext } from './PostActions';
import withErrorBoundary from '../../common/withErrorBoundary';
import { useDialog } from '../../common/withDialog';
import { useSetIsHiddenMutation } from './useSetIsHidden';
import { recombeeEnabledSetting } from '@/lib/publicSettings';
import { recombeeApi } from '@/lib/recombee/client';
import { isRecombeeRecommendablePost } from '@/lib/collections/posts/helpers';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
});

const DislikeRecommendationDropdownItemInner = ({post}: {post: PostsBase}) => {
  const isRecommendation = useContext(IsRecommendationContext)
  const currentUser = useCurrentUser();
  const {openDialog} = useDialog()
  const {captureEvent} = useTracking();

  const { setIsHiddenMutation } = useSetIsHiddenMutation();

  // We do not show post hiding from frontpage and 'dislike recommendation' as the latter includes the former. See DislikeRecommendationDropdownItem.tsx
  if (!isRecommendation) {
    return null;
  }

  const dislikeRecommendation = () => {
    if (!currentUser) {
      openDialog({
        name: "LoginPopup",
        contents: ({onClose}) => <Components.LoginPopup onClose={onClose} />
      });
      return;
    }

    if (!!currentUser && recombeeEnabledSetting.get() && isRecombeeRecommendablePost(post)) {
      void recombeeApi.createRating(post._id, currentUser._id, "bigDownvote");
    }

    void setIsHiddenMutation({postId: post._id, isHidden: true})
    captureEvent("recommendationNotInterestedClicked", {postId: post._id, pageSubElementContext: "tripleDot"})
  }

  const title = 'Dismiss recommendation'
  const icon = 'NotInterested'

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={title}
      onClick={dislikeRecommendation}
      icon={icon}
    />
  );
}

export const DislikeRecommendationDropdownItem = registerComponent(
  'DislikeRecommendationDropdownItem',
  DislikeRecommendationDropdownItemInner,
  {
    styles,
    hocs: [withErrorBoundary],
  },
);

declare global {
  interface ComponentTypes {
    DislikeRecommendationDropdownItem: typeof DislikeRecommendationDropdownItem
  }
}
