// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useQuery } from '@apollo/client';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const MatchmakingPage = ({classes}: {
  classes: ClassesType,
}) => {

  const [getMatchmakingRecommendations, {loading, data}] = useQuery(gql`
  query randomUser($userIsAuthor: String!) {
      GetRandomUser(userIsAuthor: $userIsAuthor) {
        ...UsersMinimumInfo
      }
    }
    ${fragmentTextForQuery('UsersMinimumInfo')}
  `, {
    onCompleted: (data) => {
      if (!data.GetRandomUser) return;
      // You might imagine we could redirect here, but we don't have the status
      // of the new tab key, so we use the useEffect below
      setRecievedNewResults(true);
    },
    fetchPolicy: "no-cache",
  });

  return <div className={classes.root}>

  </div>;
}

const MatchmakingPageComponent = registerComponent('MatchmakingPage', MatchmakingPage, {styles});

declare global {
  interface ComponentTypes {
    MatchmakingPage: typeof MatchmakingPageComponent
  }
}
