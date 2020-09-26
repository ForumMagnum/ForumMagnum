import { registerComponent, Components} from '../../lib/vulcan-lib';
import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from 'react-apollo';


// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const PetrovDayWrapper = () => {

  const { data: rawData } = useQuery(gql`
    query petrovDayLaunchResolvers {
      PetrovDayCheckIfIncoming(external: false) {
        launched
      }
    }
  `, {
    ssr: true
  });
  
  if (rawData?.PetrovDayCheckIfIncoming?.launched) {
    return <Components.PetrovDayLossScreen/>
  } else {
    return <Components.PetrovDayButton/>
  }
}

const PetrovDayWrapperComponent = registerComponent('PetrovDayWrapper', PetrovDayWrapper);

declare global {
  interface ComponentTypes {
    PetrovDayWrapper: typeof PetrovDayWrapperComponent
  }
}

