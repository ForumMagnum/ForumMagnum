import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";
import { autoCommentRateLimits, autoPostRateLimits } from '../../../lib/rateLimits/constants';
import { useCurrentUser } from '../../common/withUser';
import { useSingle } from '../../../lib/crud/withSingle';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const TemplateComponent = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const currentUser = useCurrentUser();

  const {document: userWithRateLimit} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UsersCurrentPostRateLimit",
    fetchPolicy: "cache-and-network",
    skip: !currentUser,
  });
  const rateLimitNextAbleToPost = userWithRateLimit?.rateLimitNextAbleToPost
  return <div className={classes.root}>

  </div>;
}

const TemplateComponentComponent = registerComponent('TemplateComponent', TemplateComponent, {styles});

declare global {
  interface ComponentTypes {
    TemplateComponent: typeof TemplateComponentComponent
  }
}

