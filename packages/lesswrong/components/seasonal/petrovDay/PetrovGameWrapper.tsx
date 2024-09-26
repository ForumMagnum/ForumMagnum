// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib';
import { useTracking } from '@/lib/analyticsEvents';
import { Components } from '@/lib/vulcan-lib';
import { useCurrentUser } from '@/components/common/withUser';
import { useMulti } from '@/lib/crud/withMulti';
import { DatabasePublicSetting } from '@/lib/publicSettings';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const PetrovGameWrapper = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { PetrovAdminConsole, PetrovWarningConsole, PetrovLaunchConsole, PetrovWorldmapWrapper } = Components;

  const currentUser = useCurrentUser()

  const { results: petrovDayActions, refetch: refetchPetrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'getAction',
      userId: currentUser?._id,
      actionType: 'hasRole',
      limit: 1
    },
    skip: !currentUser
  })

  const currentUserRole = petrovDayActions?.[0]?.data?.role
  const currentUserOptedIn = !!petrovDayActions?.length
  if (currentUser?.isAdmin) return <PetrovAdminConsole currentUser={currentUser} />

  if (!currentUser) return null

  if (currentUserRole === 'eastPetrov') {
    return <PetrovWarningConsole currentUser={currentUser} side="east"/>
  }
  if (currentUserRole === 'westPetrov') {
    return <PetrovWarningConsole currentUser={currentUser} side="west"/>
  }
  if (currentUserRole === 'eastGeneral') {
    return <PetrovLaunchConsole currentUser={currentUser} side="east" />
  } 
  if (currentUserRole === 'westGeneral') {
    return <PetrovLaunchConsole currentUser={currentUser} side="west" />
  } 
  if (currentUserOptedIn) {
    return <PetrovWorldmapWrapper>Hello citizen</PetrovWorldmapWrapper>
  }
  return null
}

const PetrovGameWrapperComponent = registerComponent('PetrovGameWrapper', PetrovGameWrapper, {styles});

declare global {
  interface ComponentTypes {
    PetrovGameWrapper: typeof PetrovGameWrapperComponent
  }
}
