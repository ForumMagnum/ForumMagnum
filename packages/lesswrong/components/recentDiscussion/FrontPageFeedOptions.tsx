import React, { useState, useCallback } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import AddBoxIcon from '@material-ui/icons/AddBox';

export interface FrontPageFeedOptions {
  mode: "recent"|"magic"
}

const FrontPageFeedOptions = ({options, setOptions, refetchRef}: {
  options: FrontPageFeedOptions,
  setOptions: (newOptions: FrontPageFeedOptions)=>void,
  refetchRef: React.RefObject<null|(()=>void)>
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { SectionTitle, SectionButton, ShortformSubmitForm } = Components;
  const [showShortformCommentBox, setShowShortformCommentBox] = useState(false);
  const title = "Recent Discussion";

  const showShortformButton = currentUser?.isReviewed && !currentUser.allCommentingDisabled

  const toggleShortformCommentBox = useCallback(
    () => {
      setShowShortformCommentBox(!showShortformCommentBox);
    },
    [setShowShortformCommentBox, showShortformCommentBox]
  );
  
  return <>
    <SectionTitle title={title}>
      {showShortformButton && <div onClick={toggleShortformCommentBox}>
        <SectionButton>
          <AddBoxIcon />
          New Shortform Post
        </SectionButton>
      </div>}
    </SectionTitle>

    {showShortformCommentBox && <ShortformSubmitForm successCallback={() => refetchRef.current?.()}/>}
  </>
}

export function getInitialFrontPageFeedOptions(currentUser: UsersCurrent|null): FrontPageFeedOptions {
  return {mode: "recent"};
}

const FrontPageFeedOptionsComponent = registerComponent('FrontPageFeedOptions', FrontPageFeedOptions);

declare global {
  interface ComponentTypes {
    FrontPageFeedOptions: typeof FrontPageFeedOptionsComponent
  }
}

