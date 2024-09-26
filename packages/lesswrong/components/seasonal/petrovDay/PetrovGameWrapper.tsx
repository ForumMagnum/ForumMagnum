import React, { useEffect } from 'react';
import { registerComponent, Components } from '@/lib/vulcan-lib';
import { useCurrentUser } from '@/components/common/withUser';
import { useMulti } from '@/lib/crud/withMulti';
import { DatabasePublicSetting } from '@/lib/publicSettings';
import { DismissibleSpotlightItem } from '@/components/spotlights/DismissibleSpotlightItem';
import { useSingle } from '@/lib/crud/withSingle';
import { gql, useQuery } from '@apollo/client';
import { userIsAdmin } from '@/lib/vulcan-users';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const PetrovGameWrapper = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { PetrovAdminConsole, PetrovWarningConsole, PetrovLaunchConsole, PetrovWorldmapWrapper, PetrovDayLossScreen } = Components;

  const currentUser = useCurrentUser()

  const { results: petrovDayRoleActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'getAction',
      userId: currentUser?._id,
      actionType: 'hasRole',
      limit: 1
    },
    skip: !currentUser
  });


  const { data, refetch: refetchCheckIfNuked } = useQuery(gql`
    query petrov2024checkIfNuked {
      petrov2024checkIfNuked
    }
  `, {
    ssr: true,
  });

  const currentUserRole = petrovDayRoleActions?.[0]?.data?.role
  const currentUserOptedIn = !!petrovDayRoleActions?.length

  const nuked = data?.petrov2024checkIfNuked;

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser) {
        void refetchCheckIfNuked();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchCheckIfNuked, currentUser]);
  
  if (!currentUser) return null

  if (userIsAdmin(currentUser)) return <PetrovAdminConsole currentUser={currentUser} />

  if (nuked) {
    return <PetrovDayLossScreen />;
  }

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
  // return <DismissibleSpotlightItem spotlight={spotlight}/>
}

const PetrovGameWrapperComponent = registerComponent('PetrovGameWrapper', PetrovGameWrapper, {styles});

declare global {
  interface ComponentTypes {
    PetrovGameWrapper: typeof PetrovGameWrapperComponent
  }
}
