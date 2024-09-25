// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib';
import { useTracking } from '@/lib/analyticsEvents';
import { Components } from '@/lib/vulcan-lib';
import { useCurrentUser } from '@/components/common/withUser';
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const PetrovGameWrapper = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { SingleColumnSection, PetrovWarningConsole, PetrovLaunchConsole } = Components;

  const currentUser = useCurrentUser()

  const { results: petrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'getAction',
      userId: currentUser?._id,
      actionType: 'assignedRole',
      limit: 1
    },
    skip: !currentUser
  })

  if (!petrovDayActions?.[0]) return null

  if (petrovDayActions?.[0]?.data.role === "Petrov") {
    return <PetrovWarningConsole/>
  } else if (petrovDayActions?.[0]?.data.role === "General") {
    return <PetrovLaunchConsole/>
  } else if (petrovDayActions?.[0]?.data.role === "Citizen") {
    return <div>Citizen!</div>
  }
}

const PetrovGameWrapperComponent = registerComponent('PetrovGameWrapper', PetrovGameWrapper, {styles});

declare global {
  interface ComponentTypes {
    PetrovGameWrapper: typeof PetrovGameWrapper
  }
}
