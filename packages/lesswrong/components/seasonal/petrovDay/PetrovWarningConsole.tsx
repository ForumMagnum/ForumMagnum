// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '@/lib/vulcan-lib';
import { gql, useQuery } from '@apollo/client';

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

  const { data } = useQuery(gql`
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
  const minutesRemaining = Math.abs(currentMinute - 50)
  console.log({currentMinute, minutesRemaining})
  
  if (currentMinute >= 50 && currentMinute < 60) {
    return <PetrovWorldmapWrapper>
      <h1>{count} detected missiles</h1>
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
