import React, { useEffect, useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { useMutation } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
import PetrovWorldmapWrapper from "./PetrovWorldmapWrapper";
import PastWarnings from "./PastWarnings";
import { gql } from "@/lib/generated/gql-codegen";

const PetrovDayActionInfoMultiQuery = gql(`
  query multiPetrovDayActionPetrovWarningConsoleQuery($selector: PetrovDayActionSelector, $limit: Int, $enableTotal: Boolean) {
    petrovDayActions(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PetrovDayActionInfo
      }
      totalCount
    }
  }
`);

const PetrovDayActionInfoMutation = gql(`
  mutation createPetrovDayActionPetrovWarningConsole($data: CreatePetrovDayActionDataInput!) {
    createPetrovDayAction(data: $data) {
      data {
        ...PetrovDayActionInfo
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {

  },
  minutesRemaining: {
    fontSize: '.9rem',
    color: theme.palette.grey[600]
  },
  reportButton: {
    border: theme.palette.border.answerBorder,
    borderRadius: 6,
    margin: 10,
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.grey[200]
    }
  }
});

const STARTING_MINUTE = 50

export const inWarningWindow = (currentMinute: number) => {
  return currentMinute >= STARTING_MINUTE || currentMinute < 17
}

export const PetrovWarningConsole = ({classes, currentUser, side}: {
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
  side: 'east' | 'west'
}) => {
  const { data: dataPetrovDayActionInfo, refetch: refetchPetrovDayActions } = useQuery(PetrovDayActionInfoMultiQuery, {
    variables: {
      selector: { warningConsole: { side: side } },
      limit: 200,
      enableTotal: false,
    },
    skip: !currentUser,
    notifyOnNetworkStatusChange: true,
  });

  const petrovDayActions = dataPetrovDayActionInfo?.petrovDayActions?.results ?? [];
  const [lastReported, setLastReported] = useState<string | null>(null)

  const pastWarnings = side === 'east'
    ? petrovDayActions.filter(({actionType}) => actionType === 'eastPetrovAllClear' || actionType === 'eastPetrovNukesIncoming')
    : petrovDayActions.filter(({actionType}) => actionType === 'westPetrovAllClear' || actionType === 'westPetrovNukesIncoming');

  const latestWarning = pastWarnings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt || lastReported

  const canSendNewReport = true

  const currentMinute = new Date().getMinutes();
  const reportWindow = inWarningWindow(currentMinute)
  const minutesRemaining = Math.abs(currentMinute - STARTING_MINUTE)

  const { data, refetch: refetchCount } = useQuery(gql(`
    query petrovDay2024Resolvers {
      PetrovDay2024CheckNumberOfIncoming {
        count
      }
    }
  `), {
    ssr: true,
  });

  const count = data?.PetrovDay2024CheckNumberOfIncoming?.count?.toLocaleString()

  const [createPetrovDayAction, { loading: createPetrovDayActionLoading }] = useMutation(PetrovDayActionInfoMutation);

  const handleReport = async (incoming: boolean) => {
    if (!canSendNewReport || !reportWindow) return
    const reportActionType = incoming ? (side === 'east' ? 'eastPetrovNukesIncoming' : 'westPetrovNukesIncoming') : (side === 'east' ? 'eastPetrovAllClear' : 'westPetrovAllClear')
    await createPetrovDayAction({  
      variables: {
        data: {
          userId: currentUser._id,
          actionType: reportActionType,
        }
      }
    }) 
    void refetchPetrovDayActions()
    setLastReported(new Date().toISOString())
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser) {
        void refetchCount();
        void refetchPetrovDayActions();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchCount, refetchPetrovDayActions, currentUser]);

  if (inWarningWindow(currentMinute)) {
    return <PetrovWorldmapWrapper>
      <h1>{count} detected missiles</h1>
      {createPetrovDayActionLoading && <div>Loading...</div>}
      {canSendNewReport && !createPetrovDayActionLoading && <div>
        <button className={classes.reportButton} onClick={() => handleReport(false)}>Report "All Clear"</button>
        <button className={classes.reportButton} onClick={() => handleReport(true)}>Report INCOMING NUKES</button>
      </div>}
      <PastWarnings petrovDayActions={petrovDayActions} side={side} />
    </PetrovWorldmapWrapper>;
  } else {
    return <PetrovWorldmapWrapper>
      <h2>Scanning...</h2>
      <div className={classes.minutesRemaining}>{minutesRemaining} minutes until next scan complete</div>
      <PastWarnings petrovDayActions={petrovDayActions} side={side} />
    </PetrovWorldmapWrapper>;
  }
}

export default registerComponent('PetrovWarningConsole', PetrovWarningConsole, {styles});


