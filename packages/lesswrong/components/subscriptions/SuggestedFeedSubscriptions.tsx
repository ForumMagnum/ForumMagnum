import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { usePaginatedResolver } from '../hooks/usePaginatedResolver';

const styles = (theme: ThemeType) => ({
  root: {

  }
});


const subscribeToUser = () => {
  
  
}

const SubsscriptionButton = (user: UsersMinimumInfo) => {
  return <div>
    {user.displayName}
  <div onClick={subscribeToUser}>
    SUBSCRIBE
  </div>

    

  </div>;
}

export const SuggestedFeedSubscriptions = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const { results } = usePaginatedResolver({
    fragmentName: "UsersMinimumInfo",
    resolverName: "SuggestedFeedSubscriptionUsers",
    limit: 20,
    itemsPerPage: 10,
  });

  console.log({suggestUserDisplayNames: results?.map(user => user.displayName)})

  return <div className={classes.root}>
    {results?.map((user) => {
      return <div key={user._id}>
        {user.displayName}
      </div>
    })
    }

  </div>;
}

const SuggestedFeedSubscriptionsComponent = registerComponent('SuggestedFeedSubscriptions', SuggestedFeedSubscriptions, {styles});

declare global {
  interface ComponentTypes {
    SuggestedFeedSubscriptions: typeof SuggestedFeedSubscriptionsComponent
  }
}
