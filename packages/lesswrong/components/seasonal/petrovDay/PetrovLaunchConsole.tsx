// TODO: Import component in components.ts
import React, { useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib';
import { useTracking } from '@/lib/analyticsEvents';
import { Components } from '@/lib/vulcan-lib';
import { hour } from 'later';
import { useCurrentUser } from '@/components/common/withUser';
import { useCreate } from '@/lib/crud/withCreate';
import { useMulti } from '@/lib/crud/withMulti';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    '& h3': {
      fontSize: '1.35rem',
      fontWeight: 'bold',
      marginBottom: 20
    }
  },
  launchButton: {
    cursor: 'pointer',
    border: '1px solid #000',
    padding: 25,
    borderRadius: 50,
    color: theme.palette.background.pageActiveAreaBackground,
    textAlign: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    verticalAlign: 'middle',
    background: 'linear-gradient(45deg, #ff0000, #990000)',
    '&:hover': {
      background: 'linear-gradient(45deg, #cc0000, #770000)',
    },
  },
  reportsContainer: {
    marginBottom: 20,
    textAlign: 'center',
    '& h4': {
      fontSize: '1.2rem',
      marginBottom: 8
    }
  },
  disabledLaunchButton: {
    background: 'linear-gradient(45deg, #aa8080, #404040)',
    '&:hover': {
      background: 'linear-gradient(45deg, #998080, #504040)',
    },
    cursor: 'not-allowed'
  }
});

export const PetrovLaunchConsole = ({classes, side, currentUser}: {
  classes: ClassesType<typeof styles>,
  side: 'east' | 'west',
  currentUser: UsersCurrent
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { PetrovWorldmapWrapper } = Components;
  const [launched, setLaunched] = useState(false)

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
  const petrovReportActionType = side === 'east' ? 'eastPetrov' : 'westPetrov'
  const petrovReports = petrovDayActions.filter((action) => action.actionType === petrovReportActionType)

  const launchActionType = side === 'east' ? 'nukeTheWest' : 'nukeTheEast'
  const launchAction = petrovDayActions.find((action) => action.actionType === launchActionType) || launched

  const { create: createPetrovDayAction } = useCreate({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo'
  })

  const handleLaunch = () => {
    if (launchAction) return
    const attackActionType = side === 'east' ? 'nukeTheWest' : 'nukeTheEast'
    void createPetrovDayAction({  
      data: {
        userId: currentUser._id,
        actionType: attackActionType,
      }
    }) 
  }

  const launchButtonText = launchAction ? 'LAUNCHED' : 'LAUNCH'

  return <PetrovWorldmapWrapper>
    <div className={classes.root}>
      <h3>{side === 'east' ? 'East' : 'West'} Wrongia General's Console</h3>
      <div className={classes.reportsContainer}>
        <h4>Reports</h4>
        {petrovReports.length === 0 ? <em>None</em> : petrovReports?.map((action) => <div key={action._id}>{action.data.warning}</div>)}
      </div>
      <div className={classNames(classes.launchButton, !!launchAction && classes.disabledLaunchButton)} onClick={handleLaunch}>
        {launchButtonText} 
      </div>
    </div>
  </PetrovWorldmapWrapper>
}

const PetrovLaunchConsoleComponent = registerComponent('PetrovLaunchConsole', PetrovLaunchConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovLaunchConsole: typeof PetrovLaunchConsoleComponent
  }
}
