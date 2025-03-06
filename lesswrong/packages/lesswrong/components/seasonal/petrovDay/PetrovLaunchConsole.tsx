import React, { useEffect, useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components.tsx';
import { useTracking } from '@/lib/analyticsEvents';
import { useCreate } from '@/lib/crud/withCreate';
import { useMulti } from '@/lib/crud/withMulti';
import classNames from 'classnames';
import { PetrovDayActionType } from '@/lib/collections/petrovDayActions/schema';
import PetrovWorldmapWrapper from "@/components/seasonal/petrovDay/PetrovWorldmapWrapper";
import PastWarnings from "@/components/seasonal/petrovDay/PastWarnings";
import { TextField } from "@/components/mui-replacement";

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
    border: `1px solid  ${theme.palette.grey[900]}`,
    padding: 25,
    borderRadius: 50,
    color: theme.palette.background.pageActiveAreaBackground,
    textAlign: 'center',
    fontSize: '1.5rem',
    verticalAlign: 'middle',
    background: `linear-gradient(45deg, ${theme.palette.petrov.red}, ${theme.palette.petrov.darkRed})`,
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.petrov.red2}, ${theme.palette.petrov.darkRed2})`,
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
    background: `linear-gradient(45deg, ${theme.palette.petrov.color1}, ${theme.palette.petrov.color2})`,
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.petrov.color3}, ${theme.palette.petrov.color4})`,
    },
    cursor: 'not-allowed'
  },
  launchCodeInput: {
    '& input': {
      fontSize: "2rem",
      width: 130,
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
  const petrovReportActionTypes: PetrovDayActionType[] = side === 'east' ? ['eastPetrovAllClear', 'eastPetrovNukesIncoming'] : ['westPetrovAllClear', 'westPetrovNukesIncoming']
  const petrovReports = petrovDayActions.filter((action) => petrovReportActionTypes.includes(action.actionType))

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
      if (currentUser) {
        refetchPetrovDayActions();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchPetrovDayActions, currentUser]);

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
      <div className={classNames(classes.launchButton, !!launchAction && classes.disabledLaunchButton, launchCode !== "000000" && classes.unreadyLaunchButton)} onClick={handleLaunch}>
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

export default PetrovLaunchConsoleComponent;
