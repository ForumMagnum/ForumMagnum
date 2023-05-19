import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const UserRateLimitItem = ({userId, classes}: {
  userId: string,
  classes: ClassesType,
}) => {
  const { WrappedSmartForm } = Components;
  return <div className={classes.root}>
    <WrappedSmartForm
      collectionName='UserRateLimits'
      // queryFragmentName='UserRateLimitDisplay'
      mutationFragmentName='UserRateLimitDisplay'
      fields={['type', 'intervalMs', 'actionsPerInterval']}
      // removeFields={['actionsPerInterval']}
      prefilledProps={{
        userId
      }}
    />
    
  </div>;
}

const UserRateLimitItemComponent = registerComponent('UserRateLimitItem', UserRateLimitItem, {styles});

declare global {
  interface ComponentTypes {
    UserRateLimitItem: typeof UserRateLimitItemComponent
  }
}

