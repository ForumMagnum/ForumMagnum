import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import React, { useState } from 'react';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { useMutation, gql } from '@apollo/client';
import { useMessages } from "../common/withMessages";
import {
  getPetrovDayKarmaThreshold,
  userCanLaunchPetrovMissile,
  usersAboveKarmaThresholdHardcoded20220922
} from "../../lib/petrovHelpers";
import LWTooltip from "../common/LWTooltip";
import LoginPopupButton from "../users/LoginPopupButton";
import { Typography } from "../common/Typography";
import { WrappedReactMapGL } from '../community/WrappedReactMapGL';

export const petrovPostIdSetting = new DatabasePublicSetting<string>('petrov.petrovPostId', '')
export const petrovGamePostIdSetting = new DatabasePublicSetting<string>('petrov.petrovGamePostId', '')
export const petrovDayLaunchCode = 'whatwouldpetrovdo?'

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    zIndex: theme.zIndexes.petrovDayButton,
    position:"relative",
    height: 520,
  },
  panelBacking: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: 520,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.panelBackground.darken40,
  },
  panel: {
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*3,
    paddingRight: theme.spacing.unit*3,
    paddingBottom: theme.spacing.unit*2,
    borderRadius: 5,
    boxShadow: `0 0 10px ${theme.palette.grey[800]}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  title: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2
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
    height: 189,
    width: 189,
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
    alignItems: "center"
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
    marginTop: theme.spacing.unit*1.5,
    width: 255,
    textAlign: "center",
    lineHeight: "1.4em",
    color: theme.palette.grey[600],
    fontSize: "1.4rem"
  },
  link: {
    marginTop: theme.spacing.unit*1.5,
    color: theme.palette.primary.main
  }
})

const PetrovDayButton = ({classes, alreadyLaunched }: {
  classes: ClassesType<typeof styles>,
  refetch?: any,
  alreadyLaunched?: boolean,
}) => {
  const currentUser = useCurrentUser()
  const { petrovPressedButtonDate } = (currentUser || {}) as any;
  const [pressed, setPressed] = useState(false) //petrovPressedButtonDate)
  const [launchCode, setLaunchCode] = useState('')


  const [ mutate ] = useMutation(gql`
    mutation petrovDayLaunchResolvers($launchCode: String) {
      PetrovDayLaunchMissile(launchCode: $launchCode) {
        launchCode
      }
    }
  `
  );
  
  const { flash } = useMessages();
  const updateCurrentUser = useUpdateCurrentUser();
  
  const pressButton = () => {
    setPressed(true)
    void updateCurrentUser({
      petrovPressedButtonDate: new Date()
    });
  }

  const updateLaunchCode = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!alreadyLaunched) {
      setLaunchCode(event.target.value)
    }
  }

  const launch = async () => {
    if (!currentUser) return
    void mutate({ variables: { launchCode } })
    
    if (launchCode !== petrovDayLaunchCode) {
      flash({ messageString: "incorrect code, missile launch aborted", type: 'failure'});
    } else {
      flash({ messageString: "missiles launched!! i hope you made good choices...", type: 'success'});
    }
    
  }

  const renderButtonAsPressed = !!petrovPressedButtonDate || pressed
  const renderLaunchButton = (launchCode?.length >= 8)
  
  const currentKarmaThreshold = getPetrovDayKarmaThreshold()
  const disableLaunchButton = !userCanLaunchPetrovMissile(currentUser) 
  
  const beforePressMessage = <p>press button to initiate missile launch procedure</p>
  const afterPressMessage = disableLaunchButton ? <p>You are not authorized to initiate a missile strike at this time. Try again later.</p> : <p>enter launch code to initiate missile strike</p>

  return (
    <div className={classes.root}>
      <WrappedReactMapGL
        zoom={2}
        width="100%"
        height="100%"
      />
      <div className={classes.panelBacking}>
        
        
        {<div className={classes.panel}>
          <Typography variant="display1" className={classes.karmaThreshold}>
            <Link className={classes.karmaThreshold} to={"/posts/" + petrovPostIdSetting.get()}>
              <div>{`Karma Threshold: ${currentKarmaThreshold}`}</div>
              <div className={classes.usersAboveThreshold}>{`Users above threshold: ${usersAboveKarmaThresholdHardcoded20220922[currentKarmaThreshold]}`}</div>
              {!!currentUser && <div className={classes.yourKarma}>{`Your Karma: ${currentUser.karma}`}</div>}
            </Link>
          </Typography>
          {currentUser ? 
              <div className={classes.button}>
                {renderButtonAsPressed ? 
                  <LWTooltip title={<div><div>You have pressed the button.</div><div>You cannot un-press it.</div></div>} placement="right">
                    <img src={"../petrovButtonPressedDark.png"}/> 
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
  
          <div className={classes.inputSection}>
            {renderButtonAsPressed && <TextField
              onChange={updateLaunchCode}
              placeholder={"Enter The Launch Code"}
              margin="normal"
              variant="outlined"
            />}
            {(renderLaunchButton) && 
              <Button onClick={launch} className={classes.launchButton} disabled={disableLaunchButton}>
                Launch
              </Button>
            }
            <div className={classes.info}>
              { renderButtonAsPressed ? afterPressMessage : beforePressMessage }
            </div>
          </div>
          
            <Link to={"/posts/" + petrovGamePostIdSetting.get()} className={classes.link}>
              Learn More
            </Link>
          </div>}
        </div>
    </div>
  )
}

export default registerComponent('PetrovDayButton', PetrovDayButton, {styles});



