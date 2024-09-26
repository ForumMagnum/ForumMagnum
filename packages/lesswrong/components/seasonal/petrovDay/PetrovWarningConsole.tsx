// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib';
import { useTracking } from '@/lib/analyticsEvents';
import { Components } from '@/lib/vulcan-lib';
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const PetrovWarningConsole = ({classes, currentUser, side}: {
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
  side: 'east' | 'west'
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { PetrovWorldmapWrapper } = Components;

  const { results: petrovDayActions = [], refetch: refetchPetrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'launchDashboard',
      side: side,
      limit: 200
    },
    skip: !currentUser
  })

  return <PetrovWorldmapWrapper>
    <div className={classes.root}>
      <h1>Warning Console</h1>
    </div>
  </PetrovWorldmapWrapper>
}

const PetrovWarningConsoleComponent = registerComponent('PetrovWarningConsole', PetrovWarningConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovWarningConsole: typeof PetrovWarningConsoleComponent
  }
}