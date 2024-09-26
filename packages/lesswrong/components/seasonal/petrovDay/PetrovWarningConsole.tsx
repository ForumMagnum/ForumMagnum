// TODO: Import component in components.ts
import React, { useEffect, useState } from 'react';
import { registerComponent, Components } from '@/lib/vulcan-lib';
import { gql, useQuery } from '@apollo/client';
import { useMulti } from '@/lib/crud/withMulti';
import { useCreate } from '@/lib/crud/withCreate';

const styles = (theme: ThemeType) => ({
  root: {

  },
  minutesRemaining: {
    fontSize: '.9rem',
    color: 'gray'
  }
});

export const PetrovWarningConsole = ({classes, currentUser, side}: {
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
  side: 'east' | 'west'
}) => {
  const { PetrovWorldmapWrapper } = Components;

  const { results: petrovDayActions = [], refetch: refetchPetrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'warningConsole',
      side: side,
      limit: 200
    },
    skip: !currentUser
  })
  const [lastReported, setLastReported] = useState<string | null>(null)
  const canSendNewReport = lastReported ? Math.abs(new Date().getMinutes() - new Date(lastReported).getMinutes()) > 50 : true

  const { data, refetch } = useQuery(gql`
    query petrovDay2024Resolvers {
      PetrovDay2024CheckNumberOfIncoming {
        count
      }
    }
  `, {
    ssr: true,
    variables: {
      side
    }
  });
  const count = data?.PetrovDay2024CheckNumberOfIncoming?.count

  const currentMinute = new Date().getMinutes();
  const reportWindow = currentMinute >= 50 && currentMinute < 60
  const minutesRemaining = Math.abs(currentMinute - 50)

  const { create: createPetrovDayAction } = useCreate({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo'
  })

  const handleReport = (message: string) => {
    if (!canSendNewReport || !reportWindow) return
    const attackActionType = side === 'east' ? 'nukeTheWest' : 'nukeTheEast'
    void createPetrovDayAction({  
      data: {
        userId: currentUser._id,
        actionType: attackActionType,
        data: {
          message
        }
      }
    }) 
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 1000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (currentMinute >= 50 && currentMinute < 60) {
    return <PetrovWorldmapWrapper>
      <h1>{count} detected missiles</h1>
      <button onClick={() => handleReport('All Clear')}>Report "All Clear"</button>
      <button onClick={() => handleReport('INCOMING NUKES')}>Report INCOMING NUKES</button>
    </PetrovWorldmapWrapper>;
  } else {
    return <PetrovWorldmapWrapper>
      <h2>Scanning...</h2>
      <div className={classes.minutesRemaining}>{minutesRemaining} minutes until next scan complete</div>
    </PetrovWorldmapWrapper>;
  }
}

const PetrovWarningConsoleComponent = registerComponent('PetrovWarningConsole', PetrovWarningConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovWarningConsole: typeof PetrovWarningConsoleComponent
  }
}
