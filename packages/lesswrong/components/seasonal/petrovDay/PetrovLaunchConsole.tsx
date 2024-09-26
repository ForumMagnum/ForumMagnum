import React, { useEffect, useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib';
import { useTracking } from '@/lib/analyticsEvents';
import { Components } from '@/lib/vulcan-lib';
import { useCreate } from '@/lib/crud/withCreate';
import { useMulti } from '@/lib/crud/withMulti';
import classNames from 'classnames';
import TextField from '@material-ui/core/TextField';

const styles = (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    overflowY: 'scroll',
    '& h3': {
      fontSize: '1.35rem',
      opacity: .6,
      marginBottom: 20
    }
  },
  launchButton: {
    marginTop: 20,
    marginBottom: 20,
    cursor: 'pointer',
    border: '1px solid #000',
    padding: 25,
    borderRadius: 50,
    color: theme.palette.background.pageActiveAreaBackground,
    textAlign: 'center',
    fontSize: '1.5rem',
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
  },
  launchCodeInput: {
    '& input': {
      fontSize: "2rem",
      width: 100,
      textAlign: 'center'
    }
  },
  unreadyLaunchButton: {
    opacity: .5
  }
});

export const PetrovLaunchConsole = ({classes, side, currentUser}: {
  classes: ClassesType<typeof styles>,
  side: 'east' | 'west',
  currentUser: UsersCurrent
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { PetrovWorldmapWrapper, PastWarnings } = Components;
  const [launched, setLaunched] = useState(false)
  const [openCodes, setOpenCodes] = useState(false)
  const [launchCode, setLaunchCode] = useState('')

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
    if (launchAction || launchCode !== "000000") return
    const attackActionType = side === 'east' ? 'nukeTheWest' : 'nukeTheEast'
    void createPetrovDayAction({  
      data: {
        userId: currentUser._id,
        actionType: attackActionType,
      }
    }) 
    setLaunched(true)
  }

  const launchButtonText = launchAction ? 'LAUNCHED' : 'LAUNCH'

  useEffect(() => {
    const interval = setInterval(() => {
      refetchPetrovDayActions();
    }, 1000);
    return () => clearInterval(interval);
  }, [refetchPetrovDayActions]);

  const updateLaunchCode = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!launchAction) {
      setLaunchCode(event.target.value)
    }
  }

  return <PetrovWorldmapWrapper>
    <div className={classes.root}>
      <h3>{side === 'east' ? 'East' : 'West'} Wrongia General's Console</h3>
      <TextField
        onChange={updateLaunchCode}
        className={classes.launchCodeInput}
        value={launchCode}
        placeholder={"Enter Code"}
        margin="normal"
        variant="outlined"
      />
      <div className={classNames(classes.launchButton, !!launchAction && classes.disabledLaunchButton, launchCode !== "000000" && classes.unreadyLaunchButton)} onClick={() => setOpenCodes(true)}>
        {launchButtonText} 
      </div>
      <PastWarnings petrovDayActions={petrovDayActions} side={side} general/>
    </div>
  </PetrovWorldmapWrapper>
}

const PetrovLaunchConsoleComponent = registerComponent('PetrovLaunchConsole', PetrovLaunchConsole, {styles});

declare global {
  interface ComponentTypes {
    PetrovLaunchConsole: typeof PetrovLaunchConsoleComponent
  }
}
