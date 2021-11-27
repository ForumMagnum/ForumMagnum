import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Divider from '@material-ui/core/Divider';

import { useCurrentUser } from '../common/withUser';
import { canNominate } from './NominatePostMenuItem';

const ReviewVotingMenuItem = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const { ReviewVotingWidget } = Components

  if (!canNominate(currentUser, post)) return null
  
  return (<React.Fragment>
      <ReviewVotingWidget post={post}/>
      <Divider/>
    </React.Fragment>
  );
}

const ReviewVotingMenuItemComponent = registerComponent('ReviewVotingMenuItem', ReviewVotingMenuItem);

declare global {
  interface ComponentTypes {
    ReviewVotingMenuItem: typeof ReviewVotingMenuItemComponent
  }
}

