import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Link } from '../../../lib/reactRouterWrapper';
import { useCurrentUser } from '../../common/withUser';
import ReactMapGL from 'react-map-gl';
import { DatabasePublicSetting, mapboxAPIKeySetting } from '../../../lib/publicSettings';
import { useMutation, gql } from '@apollo/client';
import { useMessages } from "../../common/withMessages";
import {
  getPetrovDayKarmaThreshold,
  userCanLaunchPetrovMissile,
  usersAboveKarmaThresholdHardcoded20220922
} from "../../../lib/petrovHelpers";
import { Helmet } from '../../../lib/utils/componentsWithChildren';
import { useMapStyle } from '../../hooks/useMapStyle';
import { petrovPostIdSetting, petrovDayLaunchCode, petrovGamePostIdSetting } from '../PetrovDayButton';
import { useCreate } from '@/lib/crud/withCreate';
import { useMulti } from '@/lib/crud/withMulti';

// export const petrovPostIdSetting = new DatabasePublicSetting<string>('petrov.petrovPostId', '')
// const petrovGamePostIdSetting = new DatabasePublicSetting<string>('petrov.petrovGamePostId', '')
// export const petrovDayLaunchCode = 'whatwouldpetrovdo?'

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.commentStyle,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*3,
    paddingRight: theme.spacing.unit*3,
    paddingBottom: theme.spacing.unit*2,
    borderRadius: "100px",
    marginBottom: 50,
    boxShadow: `0 0 10px ${theme.palette.grey[300]}`,
  },
  karmaThreshold: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  usersAboveThreshold: {
    marginTop: theme.spacing.unit*1.5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: "1.6rem"
  },
  yourKarma: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: "1.6rem"
  },
  timer: {
    fontSize: '3rem',
    marginTop: 10
  },
  button: {
    height: 180,
    width: 180,
    '& img': {
      marginTop: 15,
      marginLeft: 15,
      width: 150,
      height: 150,
    },
    '&:hover': {
      '& $buttonHover': {
        display: "inline-block"
      },
      '& $buttonDefault': {
        display: "none"
      }
    }
  },
  buttonHover: {
    display: "none",
    cursor: "pointer",
  },
  buttonDefault: {
    cursor: "pointer"
  },
  launchButton: {
    width: 174,
  },
  inputSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginLeft: "auto",
    marginRight: "auto",
  },
  keyCode: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit,
    border: theme.palette.border.faint,
    height: 50,
    width: "100%",
    borderRadius: 3,
    boxShadow: `0 0 10px ${theme.palette.grey[200]}`,
    padding: theme.spacing.unit*1.5
  },
  incorrectCode: {
    textAlign: "center",
    marginTop: theme.spacing.unit,
    fontSize: 12,
    color: theme.palette.grey[500]
  },
  info: {
    textAlign: "center",
    lineHeight: "1.1em",
    color: theme.palette.grey[600],
    fontSize: "1.1rem",
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    width: 300
  },
  title: {
    textAlign: "center",
    lineHeight: "2.8em",
    color: theme.palette.grey[600],
    fontSize: "2.5rem",
  },
  link: {
    marginTop: theme.spacing.unit*1.5,
    color: theme.palette.primary.main
  },
})

const OptIntoPetrovButton = ({classes, refetch, alreadyLaunched }: {
  classes: ClassesType,
  refetch?: any,
  alreadyLaunched?: boolean,
}) => {
  const currentUser = useCurrentUser()
  const { petrovPressedButtonDate } = (currentUser || {}) as any;
  const [pressed, setPressed] = useState(false) //petrovPressedButtonDate)
  const [confirmationCode, setConfirmationCode] = useState('')

  const { results: petrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'getAction',
      userId: currentUser?._id,
      actionType: 'optIn',
      limit: 1
    }
  })
    
  const optedIn = !!petrovDayActions?.length
  
  const { LWTooltip, LoginPopupButton } = Components

  const updateCurrentUser = useUpdateCurrentUser();

  const { create: createPetrovDayAction } = useCreate({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
  })
  
  const pressButton = () => {
    setPressed(true)
    void updateCurrentUser({
      petrovPressedButtonDate: new Date()
    });
  }

  const updateConfirmationCode = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!alreadyLaunched) {
      setConfirmationCode(event.target.value)
    }
  }

  const updateOptIn = async () => {
    if (!currentUser) return
    void createPetrovDayAction({  
      data: {
        userId: currentUser._id,
        actionType: 'optIn',
      }
    })
  }

  const renderButtonAsPressed = !!petrovPressedButtonDate || pressed
    
  const beforePressMessage = <div>
    <div className={classes.title}>Opt into Petrov Day</div>
  </div>
  const afterPressMessage = <p>Type your username and click "confirm" to register interest in the Petrov Day social deception game. A small number of people will be chosen as lead participants, the rest will be citizens.</p>


  return <div className={classes.root}>
          {currentUser ? 
              <div className={classes.button}>
                {renderButtonAsPressed ? 
                  <LWTooltip title={<div><div>You have pressed the button.</div><div>You cannot un-press it.</div></div>} placement="right">
                    <img className={classes.buttonPressed} src={"../petrovButtonPressedDark.png"}/> 
                  </LWTooltip>
                  :
                  <LWTooltip title="Are you sure?" placement="right">
                    <div onClick={pressButton}>
                      <img className={classes.buttonDefault} src={"../petrovButtonUnpressedDefault.png"}/>
                      <img className={classes.buttonHover} src={"../petrovButtonUnpressedHover.png"}/>
                    </div>
                  </LWTooltip>
                }
              </div>
            :
            <div className={classes.button}>
              <LoginPopupButton title={"Log in if you'd like to push the button"}>
                <div>
                  <img className={classes.buttonDefault} src={"../petrovButtonUnpressedDefault.png"}/>
                  <img className={classes.buttonHover} src={"../petrovButtonUnpressedHover.png"}/>
                </div>
              </LoginPopupButton>
            </div>
          }
          {optedIn ? 
            <div>You have opted in</div> 
            : 
            <div className={classes.inputSection}>
              {renderButtonAsPressed && <TextField
                onChange={updateConfirmationCode}
                placeholder={`Type your username`}
                margin="normal"
                variant="outlined"
              />}
              {!renderButtonAsPressed ? beforePressMessage : <div className={classes.info}>
                {afterPressMessage}
              </div>}
              {renderButtonAsPressed && <Button onClick={updateOptIn} className={classes.launchButton}>
                Confirm
              </Button>}
            </div>
          }
      </div>
}

const OptIntoPetrovButtonComponent = registerComponent('OptIntoPetrovButton', OptIntoPetrovButton, {styles});

declare global {
  interface ComponentTypes {
    OptIntoPetrovButton: typeof OptIntoPetrovButtonComponent
  }
}

