import { registerComponent, Components} from '../../lib/vulcan-lib';
import React, {useEffect, useState} from 'react';
import { useQuery, gql } from '@apollo/client';
import moment from '../../lib/moment-timezone';

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const PetrovDayWrapper = () => {
  
  const { data: internalData } = useQuery(gql`
    query petrovDayLaunchResolvers {
      PetrovDayCheckIfIncoming {
        launched
        createdAt
      }
    }
  `, {
    ssr: true
  });
  
  
  if (internalData?.PetrovDayCheckIfIncoming.launched) {
    return <Components.PetrovDayLossScreen/>
  } else {
    return <Components.PetrovDayButton
      alreadyLaunched={internalData?.PetrovDayCheckIfIncoming?.launched}
    />
  }
}

const PetrovDayWrapperComponent = registerComponent('PetrovDayWrapper', PetrovDayWrapper);

declare global {
  interface ComponentTypes {
    PetrovDayWrapper: typeof PetrovDayWrapperComponent
  }
}
