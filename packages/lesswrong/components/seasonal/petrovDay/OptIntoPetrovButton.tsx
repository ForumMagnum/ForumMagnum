import { useCreate } from '@/lib/crud/withCreate';
import { useMulti } from '@/lib/crud/withMulti';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import TextField from '@/lib/vendor/@material-ui/core/src/TextField';
import React, { useState } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import LWTooltip from "../../common/LWTooltip";
import LoginPopupButton from "../../users/LoginPopupButton";

const styles = (theme: ThemeType) => ({
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
    borderRadius: "120px",
    marginBottom: 50,
    boxShadow: `0 0 10px ${theme.palette.grey[300]}`,
    [theme.breakpoints.up('md')]: {
      width: "calc(100% + 50px)",
      marginLeft: -25,
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      flexDirection: "column",
      textWrap: "balance"
    },
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
    maxWidth: 300
  },
  optedIn: {
    marginLeft: "auto",
    marginRight: "auto",
  },
  title: {
    textAlign: "center",
    color: theme.palette.grey[600],
    fontSize: "2.5rem",
  },
  link: {
    marginTop: theme.spacing.unit*1.5,
    color: theme.palette.primary.main
  },
  error: {
    color: theme.palette.error.main,
    marginTop: theme.spacing.unit*2,
    textAlign: "center"
  }
})

const OptIntoPetrovButton = ({classes }: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()
  const petrovPressedButtonDate = currentUser?.petrovPressedButtonDate
  const [pressed, setPressed] = useState(false) //petrovPressedButtonDate)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [error, setError] = useState('')
  const [displayOptedIn, setDisplayOptedIn] = useState(false)

  const { results: petrovDayActions, refetch: refetchPetrovDayActions } = useMulti({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo',
    terms: {
      view: 'getAction',
      userId: currentUser?._id,
      actionType: 'optIn',
      limit: 1
    },
    skip: !currentUser
  })
  const currentUserOptedIn = !!petrovDayActions?.length

  const optedIn = currentUserOptedIn || displayOptedIn
  const updateCurrentUser = useUpdateCurrentUser();

  const { create: createPetrovDayAction } = useCreate({
    collectionName: 'PetrovDayActions',
    fragmentName: 'PetrovDayActionInfo'
  })
  
  const pressButton = () => {
    setPressed(true)
    void updateCurrentUser({
      petrovPressedButtonDate: new Date()
    });
  }

  const updateConfirmationCode = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setConfirmationCode(event.target.value)
  }

  const updateOptIn = async () => {
    if (!currentUser) {
      setError('You must log in to opt in')
      return
    }
    if (confirmationCode === currentUser.displayName) {
      void createPetrovDayAction({  
        data: {
          userId: currentUser._id,
          actionType: 'optIn',
        }
      }) 
      setDisplayOptedIn(true)
      await refetchPetrovDayActions()
    } else {
      setError('Display name does not match')
    }
  }

  const buttonPressedInLastWeek = (!!petrovPressedButtonDate && new Date().getTime() - new Date(petrovPressedButtonDate).getTime() < 7 * 24 * 60 * 60 * 1000)

  const renderButtonAsPressed = buttonPressedInLastWeek || pressed
    
  const beforePressMessage = <div className={classes.title}>Opt into Petrov Day</div>
  
  const afterPressMessage = <div>
    <p>Type your display name and click "confirm" to register interest in the Petrov Day social deception game.</p>
    <p>A small number of people will be chosen as lead participants, the rest will be citizens.</p>
  </div>


  return <div className={classes.root}>
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
          {optedIn ? 
            <div className={classes.optedIn}>
              You have opted into Petrov Day
            </div> 
            : 
            <div className={classes.inputSection}>
              {renderButtonAsPressed && <TextField
                onChange={updateConfirmationCode}
                value={confirmationCode}
                placeholder={`Type your display name`}
                margin="normal"
                variant="outlined"
              />}
              {!renderButtonAsPressed ? beforePressMessage : <div className={classes.info}>
                {afterPressMessage}
              </div>}
              {error && <div className={classes.error}>{error}</div>}
              {renderButtonAsPressed && <Button onClick={updateOptIn} className={classes.launchButton}>
                Confirm
              </Button>}
            </div>
          }
      </div>
}

export default registerComponent('OptIntoPetrovButton', OptIntoPetrovButton, {styles});



