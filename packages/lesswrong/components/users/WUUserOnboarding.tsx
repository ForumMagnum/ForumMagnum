import React, {useState} from 'react'
import {gql, useMutation} from '@apollo/client'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import TextField, {TextFieldProps} from '@material-ui/core/TextField'
import {siteNameWithArticleSetting} from '../../lib/instanceSettings'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useMessages} from '../common/withMessages'
import {TosLink} from '../posts/PostsAcceptTos'
import {textFieldContainerStyles, textFieldStyles} from '../form-components/MuiTextField.tsx'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    padding: '40px 22px',
    borderRadius: 6,
    
    "& .MuiIconButton-root": {
      paddingTop: 7,
      paddingBottom: 7,
    },
  },
  title: {
    marginTop: 0,
    [theme.breakpoints.down('md')]: {
      fontSize: 28,
    },
    color: theme.palette.text.normal,
    fontWeight: 700,
    fontSize: 30.8,
  },
  section: {
    marginTop: theme.spacing.unit * 3,
  },
  sectionHeadingText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
    fontWeight: 700,
    fontSize: 22,
  },
  sectionHelperText: {
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
  },
  submitButtonSection: {
    marginTop: theme.spacing.unit * 3,
  },
  formInput: {
    ...textFieldStyles(theme),
  },
  inputContainer: {
    ...textFieldContainerStyles(theme),
    borderRadius: 6,
    border: theme.palette.border.grey300,
    flexGrow: 1,
    marginRight: '0.5em',
    marginTop: '0.5em',
  },
  nameContainer: {
    display: 'flex',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      flexWrap: 'wrap',
    },
  },
})

type WUUserOnboardingProps = {
  currentUser: UsersCurrent
  classes: ClassesType
}

const WUTextField = ({classes, ...props}: TextFieldProps & { classes: ClassesType }) =>
  <div className={classes.inputContainer}>
    <TextField
      {...props}
      InputProps={{disableUnderline: true}}
      className={classes.formInput}
    /></div>

const WUUserOnboarding: React.FC<WUUserOnboardingProps> = ({currentUser, classes}) => {
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState(currentUser.first_name)
  const [lastName, setLastName] = useState(currentUser.last_name)
  const [subscribeToDigest, setSubscribeToDigest] = useState(true)
  const [allowNewPrivateMessageRequests, setAllowNewPrivateMessageRequests] = useState(true)
  const [acceptedTos, setAcceptedTos] = useState(false)
  const [mapLocation, setMapLocation] = useState(currentUser.mapLocation)
  const [validationError, setValidationError] = useState('')
  const [updateUser] = useMutation(gql`
    mutation WUUserOnboarding(
    $username: String!, 
    $subscribeToDigest: Boolean!, 
    $acceptedTos: Boolean!,
    $allowNewPrivateMessageRequests: Boolean!,
    $firstName: String, 
    $lastName: String, 
    $mapLocation: JSON
    ) {
      WUUserOnboarding(
      username: $username, 
      subscribeToDigest: $subscribeToDigest, 
      acceptedTos: $acceptedTos,
      allowNewPrivateMessageRequests: $allowNewPrivateMessageRequests,
      firstName: $firstName, 
      lastName: $lastName, 
      mapLocation: $mapLocation
      ) {
        username
        slug
        displayName
      }
    }
  `, {refetchQueries: ['getCurrentUser']})
  const {flash} = useMessages()
  const {SingleColumnSection, Typography, EAButton, LocationPicker, EAUsersProfileImage, MuiTextField} = Components

  function validateUsername(username: string): void {
    if (username.length === 0) {
      setValidationError('Please enter a username')
      return
    }
    setValidationError('')
  }

  async function handleSave() {
    try {
      if (validationError) return

      await updateUser({
        variables: {
          username,
          subscribeToDigest,
          firstName,
          lastName,
          allowNewPrivateMessageRequests,
          mapLocation,
          acceptedTos,
        },
      })
    } catch (err) {
      if (/Username/.test(err.toString?.())) {
        setValidationError('Username is already taken')
      }
      // eslint-disable-next-line no-console
      console.error(err)
      flash(`${err}`)
    }
  }

  return <SingleColumnSection>
    <div className={classes.root}>
      <Typography variant="display2" gutterBottom className={classes.title}>
        Welcome to the {siteNameWithArticleSetting.get()} Beta
      </Typography>

      <Typography variant="body2">
        We're glad you're here. This is a new place for Waking Up members to connect, ask questions, share experiences,
        and support each other in meditation and beyond.
      </Typography>
      <br/>
      <Typography variant="body2">
        Before joining us on the forum, take a moment to complete your community profile.
      </Typography>
      <br/>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Create a username
        </Typography>
        <Typography variant="body2" gutterBottom>
          Your username will appear next to your posts and comments, and your full name will show up on your profile.
          We recommend using your real name in the community.
        </Typography>
        <WUTextField
          label={'Username'}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onBlur={(_event) => validateUsername(username)}
          classes={classes}
          inputProps={{maxLength: 70}}
        />
        <div className={classes.nameContainer}>
          <WUTextField
            label="First Name (optional)"
            value={firstName || ''}
            onChange={(event) => setFirstName(event.target.value)}
            classes={classes}
          />
          <WUTextField
            label="Last Name (optional)"
            value={lastName || ''}
            onChange={(event) => setLastName(event.target.value)}
            classes={classes}
          />
        </div>
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Set your city
        </Typography>
        <Typography variant="body2" gutterBottom>
          Your city will appear on your profile. (And we may explore features that help you connect with other members
          near you in the future.)
        </Typography>
        <div className={classes.inputContainer}>
          <LocationPicker
            document={currentUser}
            path={'mapLocation'}
            value={mapLocation}
            label="City (optional)"
            updateCurrentValues={(it: any) => {
              setMapLocation(it['mapLocation'])
            }}
            locationTypes={['(cities)']}
          />
        </div>
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Add a photo
        </Typography>
        <Typography variant="body2" gutterBottom>
          You can use a default avatar from the Waking Up app or add a photo of yourself (encouraged).
        </Typography>
        <br/>
        <EAUsersProfileImage user={currentUser}/>
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Control private messages
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText} gutterBottom>
          Decide whether you want to receive private messages from other members.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={allowNewPrivateMessageRequests}
              onChange={event => setAllowNewPrivateMessageRequests(event.target.checked)}
            />
          }
          label="Allow new private message requests"
        />
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Get a weekly email
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText} gutterBottom>
          We’ll send notes and recommended posts from the community. You can always unsubscribe.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={subscribeToDigest}
              onChange={event => setSubscribeToDigest(event.target.checked)}
            />
          }
          label="Get the weekly community email"
        />
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          One last thing
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTos}
              onChange={event => setAcceptedTos(event.target.checked)}
            />
          }
          label={
            <Typography variant="body2" className={classes.sectionHelperText} gutterBottom>
              I acknowledge and agree that the Waking Up <TosLink>Terms of Service</TosLink> (last updated October 27,
              2023) apply to my access to and use of the Community.
            </Typography>}
        />
      </div>
      
      <div className={classes.submitButtonSection}>
        <EAButton onClick={handleSave} disabled={!!validationError || !acceptedTos}>
          Join the Community
        </EAButton>
      </div>
    </div>
  </SingleColumnSection>
}

const WUUserOnboardingComponent = registerComponent(
  'WUUserOnboarding',
  WUUserOnboarding,
  {styles},
)

declare global {
  interface ComponentTypes {
    WUUserOnboarding: typeof WUUserOnboardingComponent;
  }
}
