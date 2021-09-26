import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import ReactMapGL from 'react-map-gl';
import { Helmet } from 'react-helmet';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { DatabasePublicSetting, mapboxAPIKeySetting } from '../../lib/publicSettings';
import { useMutation, gql } from '@apollo/client';

const petrovPostIdSetting = new DatabasePublicSetting<string>('petrov.petrovPostId', '')
const petrovGamePostIdSetting = new DatabasePublicSetting<string>('petrov.petrovGamePostId', '')

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const styles = (theme: ThemeType): JssStyles => ({
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
    backgroundColor: "rgba(0,0,0,.4)"
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
  incomingTitle: {
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*2,
    color: 'red',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
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
    flexDirection: "column"
  },
  keyCode: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit,
    border: "solid 1px rgba(0,0,0,.1)",
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
    lineHeight: "1.8em",
    color: theme.palette.grey[600]
  },
  link: {
    marginTop: theme.spacing.unit*1.5,
    color: theme.palette.primary.main
  }
})

const PetrovDayButton = ({classes, refetch, alreadyLaunched, timeTillArrival}: {
  classes: ClassesType,
  refetch?: any,
  alreadyLaunched?: boolean,
  timeTillArrival?: number
}) => {
  const currentUser = useCurrentUser()
  const { petrovPressedButtonDate, petrovCodesEntered } = (currentUser || {}) as any; //FIXME: These fields are not in the fragment; add them back for next Petrov day if we want to do it again
  const [pressed, setPressed] = useState(false) //petrovPressedButtonDate)
  const [launchCode, setLaunchCode] = useState(petrovCodesEntered)
  const [launched, setLaunched] = useState(!!alreadyLaunched)


  const [ mutate ] = useMutation(gql`
    mutation petrovDayLaunchResolvers($launchCode: String) {
      PetrovDayLaunchMissile(launchCode: $launchCode) {
        launchCode
      }
    }
  `
  );
  
  const { LWTooltip, LoginPopupButton, Typography } = Components

  const updateCurrentUser = useUpdateCurrentUser();
  
  const pressButton = () => {
    setPressed(true)
    void updateCurrentUser({
      petrovPressedButtonDate: new Date()
    });
  }

  const updateLaunchCode = (event) => {
    if (!petrovCodesEntered) {
      setLaunchCode(event.target.value)
    }
  }

  const launch = async () => {
    if (!currentUser) return
    void mutate({ variables: { launchCode } })
    setLaunched(true)
  }

  const renderButtonAsPressed = !!petrovPressedButtonDate || pressed
  const renderLaunchButton = (launchCode?.length >= 8)
  const isEAForum = forumTypeSetting.get() === 'EAForum';

  const secondsRemainingToTimeDisplay = (differenceInSeconds: number) : string => {
    const absSeconds = Math.abs(differenceInSeconds)
    
    const minutes = Math.sign(differenceInSeconds)*Math.floor(absSeconds/60)
    const seconds = ('0' + (absSeconds % 60)).slice(-2)
    return `${minutes}:${seconds}`
  }
  
  


  return (
    <div className={classes.root}>
      <Helmet> 
        <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.3.1/mapbox-gl.css' rel='stylesheet' />
      </Helmet>
      <ReactMapGL
        zoom={2}
        width="100%"
        height="100%"
        mapStyle={isEAForum ? undefined : "mapbox://styles/habryka/cilory317001r9mkmkcnvp2ra"}
        mapboxApiAccessToken={mapboxAPIKeySetting.get() || undefined}
      />
      <div className={classes.panelBacking}>
        
        
        {<div className={classes.panel}>
          {!!timeTillArrival ? 
            <Typography variant="display1" className={classes.incomingTitle}>
              <Link className={classes.incomingTitle} to={"/posts/" + petrovPostIdSetting.get()}>
                <div>MISSILES INCOMING!!</div>
                <div className={classes.timer}>
                  {secondsRemainingToTimeDisplay(timeTillArrival)}
                </div>
              </Link>
            </Typography>
            : 
            <Typography variant="display1" className={classes.title}>
            <Link to={"/posts/" + petrovPostIdSetting.get()}>Petrov Day</Link>
            </Typography>
          }
          {currentUser ? 
              <div className={classes.button}>
                {(renderButtonAsPressed || launched) ? 
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
  
          {launched ?
            <div className={classes.info}>
              <p >{isEAForum ? "The EA Forum's" : "LessWrong's"} missiles have been launched.</p>
              <p>We hope you made good choices.</p>
            </div>
            : <div className={classes.inputSection}>
              {renderButtonAsPressed && <TextField
                onChange={updateLaunchCode}
                placeholder={"Enter Launch Codes"}
                margin="normal"
                variant="outlined"
              />}
              {(renderLaunchButton) && 
                <Button onClick={launch} className={classes.launchButton} disabled={!!(currentUser as any).petrovCodesEntered}>
                  Launch
                </Button>
              }
              <div className={classes.info}>
                <p>Enter launch codes to destroy {isEAForum ? ' LessWrong' : " the EA Forum"}.</p>
                <p>(This is not an anonymous action)</p>
              </div>
            </div>
          }
          
            <Link to={"/posts/" + petrovGamePostIdSetting.get()} className={classes.link}>
              Learn More
            </Link>
          </div>}
        
        
        
        
        </div>
    </div>
  )
}

const PetrovDayButtonComponent = registerComponent('PetrovDayButton', PetrovDayButton, {styles});

declare global {
  interface ComponentTypes {
    PetrovDayButton: typeof PetrovDayButtonComponent
  }
}

