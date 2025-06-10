import React, { useEffect } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useCurrentUser } from '@/components/common/withUser';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import { userIsAdmin } from '@/lib/vulcan-users/permissions.ts';
import PetrovAdminConsole from "./PetrovAdminConsole";
import PetrovWarningConsole from "./PetrovWarningConsole";
import PetrovLaunchConsole from "./PetrovLaunchConsole";
import PetrovWorldmapWrapper from "./PetrovWorldmapWrapper";
import PetrovDayLossScreen from "../PetrovDayLossScreen";

const PetrovDayActionInfoMultiQuery = gql(`
  query multiPetrovDayActionPetrovGameWrapperQuery($selector: PetrovDayActionSelector, $limit: Int, $enableTotal: Boolean) {
    petrovDayActions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PetrovDayActionInfo
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  citizenEast: {
    width: 400,
    height: 300,
    background: "url('https://i.imgur.com/OD8ld1E.jpeg')",
    backgroundSize: 'cover !important',
    backgroundPosition: 'center !important',
    margin: "-16px -24px",
    borderRadius: 6,
    padding: 24
  },
  citizenWest: {
    width: 400,
    height: 300,
    background: "url('https://i.imgur.com/4ITjoT2.jpeg')",
    backgroundSize: 'cover !important',
    backgroundPosition: 'center !important',
    margin: "-16px -24px",
    borderRadius: 6,
    padding: 24
  },
  citizenTitle: {
    ...theme.typography.headerStyle,
    fontSize: '2.5rem',
    textShadow: `0px 0px 3px ${theme.palette.background.pageActiveAreaBackground}, 0px 0px 3px ${theme.palette.background.pageActiveAreaBackground}`,
  }
});

export const PetrovGameWrapper = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()

  const { data: dataPetrovDayActions } = useQuery(PetrovDayActionInfoMultiQuery, {
    variables: {
      selector: { getAction: { userId: currentUser?._id } },
      limit: 10,
      enableTotal: false,
    },
    skip: !currentUser,
    notifyOnNetworkStatusChange: true,
  });

  const petrovDayUserActions = dataPetrovDayActions?.petrovDayActions?.results;

  const { data, refetch: refetchCheckIfNuked } = useQuery(gql(`
    query petrov2024checkIfNuked {
      petrov2024checkIfNuked
    }
  `), {
    ssr: true,
  });

  const currentUserRole = petrovDayUserActions?.find(({actionType}) => actionType === "hasRole")?.data?.role
  const currentUserSide = petrovDayUserActions?.find(({actionType}) => actionType === "hasSide")?.data?.side

  const currentUserOptedIn = !!petrovDayUserActions?.length

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
    return <PetrovWorldmapWrapper>
      <div className={currentUserSide === 'east' ? classes.citizenEast : classes.citizenWest}>
        <div className={classes.citizenTitle}>{currentUserSide === 'east' ? 'Citizen of East Wrong' : 'Citizen of West Wrong'}</div>
      </div>
    </PetrovWorldmapWrapper>
  }
  return null
  // return <DismissibleSpotlightItem spotlight={spotlight}/>
}

export default registerComponent('PetrovGameWrapper', PetrovGameWrapper, {styles});


