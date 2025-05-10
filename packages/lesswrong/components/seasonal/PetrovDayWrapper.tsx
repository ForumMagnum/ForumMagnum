import { registerComponent } from '../../lib/vulcan-lib/components';
import React, {useEffect, useState} from 'react';
import { useQuery, gql } from '@apollo/client';
import moment from '../../lib/moment-timezone';
import { PetrovDayLossScreen } from "./PetrovDayLossScreen";
import { PetrovDayButton } from "./PetrovDayButton";

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const PetrovDayWrapperInner = () => {
  
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
    return <PetrovDayLossScreen/>
  } else {
    return <PetrovDayButton
      alreadyLaunched={internalData?.PetrovDayCheckIfIncoming?.launched}
    />
  }
}

export const PetrovDayWrapper = registerComponent('PetrovDayWrapper', PetrovDayWrapperInner);


