import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { forumSelect } from '../../../lib/forumTypeUtils';
import { autoCommentRateLimits, autoPostRateLimits } from '../../../lib/rateLimits/constants';
import { getRateLimitNames } from '../../../lib/rateLimits/utils';

const styles = (theme: ThemeType): JssStyles => ({
  postRateLimits: {
    borderBottom: theme.palette.border.faint,
    paddingBottom: 8,
    marginBottom: 8
  }
});

export const UserAutoRateLimits = ({user, classes}: {
  user: SunshineUsersList,
  classes: ClassesType
}) => {
  const { MetaInfo } = Components
  return <div>
    <div className={classes.postRateLimits}>
      {getRateLimitNames(user, forumSelect(autoPostRateLimits)).map(rateLimit => <div key={`${user._id}rateLimit`}>
        <MetaInfo>{rateLimit}</MetaInfo>
      </div>)}
    </div>
    {getRateLimitNames(user, forumSelect(autoCommentRateLimits)).map(rateLimit => <div key={`${user._id}rateLimit`}>
        <MetaInfo>{rateLimit}</MetaInfo>
      </div>)}
  </div>;
}

const UserAutoRateLimitsComponent = registerComponent('UserAutoRateLimits', UserAutoRateLimits, {styles});

declare global {
  interface ComponentTypes {
    UserAutoRateLimits: typeof UserAutoRateLimitsComponent
  }
}

