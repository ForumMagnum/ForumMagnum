import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useState } from 'react';
import { mapsHeight } from '../localGroups/CommunityMap';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import Users from '../../lib/collections/users/collection';

// This component is (most likely) going to be used once-a-year on Petrov Day (sept 26th)
// see this post:
// https://www.lesswrong.com/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019

const styles = theme => ({
  root: {
    ...theme.typography.commentStyle,
    position: "absolute",
    top: 0,
    zIndex: theme.zIndexes.petrovDayButton,
    width: "100vw",
    height: mapsHeight,
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
  link: {
    marginTop: theme.spacing.unit*1.5,
    color: theme.palette.grey[600]
  }
})

const PetrovDayButton = ({classes, refetch}: {
  classes: ClassesType,
  refetch?: any,
}) => {
  const currentUser = useCurrentUser()
  const { petrovPressedButtonDate, petrovCodesEntered } = (currentUser || {}) as any; //FIXME: These fields are not in the fragment; add them back for next Petrov day if we want to do it again
  const [pressed, setPressed] = useState(petrovPressedButtonDate)
  const [launchCode, setLaunchCode] = useState(petrovCodesEntered)

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const pressButton = () => {
    setPressed(true)
    void updateUser({
      selector: {_id: currentUser!._id},
      data: { petrovPressedButtonDate: new Date() }
    });
  }

  const updateLaunchCode = (event) => {
    if (!petrovCodesEntered) {
      setLaunchCode(event.target.value)
    }
  }

  const launch = async () => {
    if (!currentUser) {
      return
    }
    await updateUser({
      selector: {_id: currentUser._id},
      data: { 
        petrovCodesEnteredDate: new Date (),
        petrovCodesEntered: launchCode
      }
    });
    refetch()
  }

  const renderButtonAsPressed = !!petrovPressedButtonDate || pressed
  const renderLaunchButton = (launchCode?.length >= 8)
  
  if (petrovCodesEntered) return null

  return (
    <div className={classes.root}>
      <div className={classes.panel}>
        <Typography variant="display1" className={classes.title}>
          <Link to={"/posts/QtyKq4BDyuJ3tysoK/9-26-is-petrov-day"}>Petrov Day</Link>
        </Typography>
        {currentUser ? 
            <div className={classes.button}>
              {renderButtonAsPressed ? 
                <Tooltip title={<div><div>You have pressed the button.</div><div>You cannot un-press it.</div></div>} placement="right">
                  <img className={classes.buttonPressed} src={"../petrovButtonPressedDark.png"}/> 
                </Tooltip>
                :
                <Tooltip title="Are you sure?" placement="right">
                  <div onClick={pressButton}>
                    <img className={classes.buttonDefault} src={"../petrovButtonUnpressedDefault.png"}/>
                    <img className={classes.buttonHover} src={"../petrovButtonUnpressedHover.png"}/>
                  </div>
                </Tooltip>
              }
            </div>
          :
          <div className={classes.button}>
            <Components.LoginPopupButton title={"Log in if you'd like to push the button"}>
              <div>
                <img className={classes.buttonDefault} src={"../petrovButtonUnpressedDefault.png"}/>
                <img className={classes.buttonHover} src={"../petrovButtonUnpressedHover.png"}/>
              </div>
            </Components.LoginPopupButton>
          </div>
        }

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
        <Link to={"/posts/vvzfFcbmKgEsDBRHh/honoring-petrov-day-on-lesswrong-in-2019"} className={classes.link}>
          What is this button about?
        </Link>
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

