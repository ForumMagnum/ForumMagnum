import React, { useState, useRef } from "react";
import classnames from "classnames";
import { gql, useMutation } from "@apollo/client";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import TextField from "@material-ui/core/TextField";
import { isEAForum, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMessages } from "../common/withMessages";
import { getUserEmail } from "../../lib/collections/users/helpers";
import { LicenseLink, TosLink } from "../posts/PostsAcceptTos";
import { Link } from "../../lib/reactRouterWrapper";
import { AnalyticsContext } from "../../lib/analyticsEvents";

/**
 * 2023-11-17 SC: This component is not used by LW/AF, though we left some forum-gating
 * in here for elements that are probably still EAF-specific, such as the ToS.
 */

// link to the page that lists past digests
const eaForumDigestLink = 'https://us8.campaign-archive.com/home/?u=52b028e7f799cca137ef74763&id=7457c7ff3e'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    padding: '40px 50px',
    [theme.breakpoints.down('xs')]: {
      padding: '30px 20px',
    }
  },
  title: {
    fontSize: 30,
    marginTop: 0,
    [theme.breakpoints.down('md')]: {
      fontSize: 28,
    }
  },
  section: {
    maxWidth: 600,
    marginTop: 30,
    "& .MuiTypography-body1": {
      color: theme.palette.text.normal,
    },
    "& .MuiFormHelperText-root": {
      color: theme.palette.grey[600],
      fontFamily: theme.palette.fonts.sansSerifStack,
    },
  },
  sectionHeadingText: {
    fontWeight: 600,
    fontSize: 24,
    textWrap: 'pretty',
    [theme.breakpoints.down('md')]: {
      fontSize: 20,
    }
  },
  sectionHelperText: {
    color: theme.palette.grey[600],
    fontSize: '1rem',
    fontFamily: theme.palette.fonts.sansSerifStack,
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  usernameInput: {
    marginBottom: 10
  },
  tosText: {
    marginBottom: 16,
  },
  submitButtonSection: {
    marginTop: 30
  },
  callout: {
    background: theme.palette.background.default,
    padding: '16px 20px',
    borderRadius: theme.borderRadius.default
  },
  calloutHeadingText: {
    fontWeight: 600,
    fontSize: 16,
    lineHeight: '24px',
    fontFamily: theme.typography.fontFamily,
    margin: '0 0 6px',
  }
});

type NewUserCompleteProfileProps = {
  currentUser: UsersCurrent
  classes: ClassesType
}

function prefillUsername(maybeUsername: string | undefined | null): string {
  if (!maybeUsername) return ''
  if (/^\S+@\S+\.\S+$/.test(maybeUsername)) return ''
  if (/new_user_\d+/.test(maybeUsername)) return ''
  return maybeUsername
}

const NewUserCompleteProfile: React.FC<NewUserCompleteProfileProps> = ({ currentUser, classes }) => {
  const [username, setUsername] = useState(prefillUsername(currentUser.displayName))
  const emailInput = useRef<HTMLInputElement>(null)
  const [subscribeToDigest, setSubscribeToDigest] = useState(true)
  const [validationError, setValidationError] = useState('')
  const [updateUser] = useMutation(gql`
    mutation NewUserCompleteProfile($username: String!, $subscribeToDigest: Boolean!, $email: String, $acceptedTos: Boolean) {
      NewUserCompleteProfile(username: $username, subscribeToDigest: $subscribeToDigest, email: $email, acceptedTos: $acceptedTos) {
        username
        slug
        displayName
      }
    }
  `, {refetchQueries: ['getCurrentUser']})
  const {flash} = useMessages();
  const {SingleColumnSection, Typography, EAButton} = Components

  function validateUsername(username: string): void {
    if (username.length === 0) {
      setValidationError('Please enter a username')
      return
    }
    if (username.length > 70) {
      setValidationError('Username must be less than 70 characters')
      return
    }
    // TODO: Really want them to be able to tell live if their username is
    // taken, but I think that's gonna have to be a later PR.
    // Note: Probably want to prevent someone from taking an existing
    // displayName
    // if (usernameIsUnique) ...
    setValidationError('')
  }

  async function handleSave() {
    try {
      if (validationError) return

      // TODO: loading spinner while running
      await updateUser({variables: {
        username,
        subscribeToDigest,
        // We do this fancy spread so we avoid setting the email to an empty
        // string in the likely event that someone already had an email and
        // wasn't shown the set email field
        ...(!getUserEmail(currentUser) && {email: emailInput.current?.value}),
        acceptedTos: isEAForum,
      }})
    } catch (err) {
      if (/duplicate key error/.test(err.toString?.())) {
        setValidationError('Username already taken')
      }
      // eslint-disable-next-line no-console
      console.error(err)
      flash(`${err}`)
    }
  }
  
  return <AnalyticsContext pageContext="newUserRegistration">
    <SingleColumnSection>
      <div className={classes.root}>
        <Typography variant="display2" gutterBottom className={classes.title}>
          Welcome to {siteNameWithArticleSetting.get()}!
        </Typography>
        <div className={classes.section}>
          <Typography variant='display1' className={classes.sectionHeadingText} gutterBottom>
            Choose a username
          </Typography>
          <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
            We encourage you to use your real name, as it will help other people
            in the community to identify you, but you can choose a pseudonym. If
            you do, try to choose{' '}
            <a href="https://jimpix.co.uk/words/random-username-generator.asp" target="_blank" rel="noopener noreferrer">
              something recognizable like "WobblyPanda",
            </a>{' '}
            instead of a variation of anon7.
          </Typography>
          <TextField
            label='Username'
            error={!!validationError}
            helperText={validationError || 'Spaces and special characters allowed'}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            onBlur={(_event) => validateUsername(username)}
            className={classes.usernameInput}
          />
        </div>
        
        {/* Facebook user with no email fix (very small % of users) */}
        {!currentUser?.email && <div className={classes.section}>
          <Typography variant='display1' className={classes.sectionHeadingText} gutterBottom>
            Please enter your email
          </Typography>
          <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
            {/* I'd rather be honest than concise here. */}
            To get here without an email you must have logged in with Facebook
            and not given Facebook your email. We need your email to notify you of
            direct messages, and having a tiny percentage of users without an
            email makes the site harder to maintain.
          </Typography>
          <TextField
            label='Email'
            inputRef={emailInput}
          />
        </div>}

        {isEAForum && <div className={classes.section}>
          <Typography variant='display1' className={classes.sectionHeadingText} gutterBottom>
            Get weekly emails with selected posts
          </Typography>
          <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
            The EA Forum Digest is curated by the Forum team, and features highlights from
            every week, announcements, and more.{" "}
            <Link to={eaForumDigestLink} target="_blank" rel="noreferrer">
              See recent issues here
            </Link>.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={subscribeToDigest}
                onChange={event => setSubscribeToDigest(event.target.checked)}
              />
            }
            label='Yes, subscribe me to EA Forum digest emails'
          />
        </div>}
        {isEAForum && <div className={classes.section}>
          <div className={classes.callout}>
            <h2 className={classes.calloutHeadingText}>
              Chat with an EA Forum Team member
            </h2>
            <Typography variant='body1' className={classes.sectionHelperText}>
              Help us improve the site! Sign up for a user interview with a member of the EA Forum Team
              and we'll answer any questions you have about EA or the Forum.{" "}
              <Link to="https://savvycal.com/cea/forum-team" target="_blank" rel="noreferrer">
                Book a call here
              </Link>.
            </Typography>
          </div>
        </div>}
        <div className={classes.submitButtonSection}>
          {isEAForum &&
            <Typography variant="body1" className={classnames(classes.sectionHelperText, classes.tosText)} gutterBottom>
              I agree to the <TosLink />, including my content being available
              under a <LicenseLink /> license.
            </Typography>
          }
          <EAButton onClick={handleSave} disabled={!!validationError}>
            Submit
          </EAButton>
        </div>
      </div>
    </SingleColumnSection>
  </AnalyticsContext>
};

const NewUserCompleteProfileComponent = registerComponent(
  "NewUserCompleteProfile",
  NewUserCompleteProfile,
  { styles }
);

declare global {
  interface ComponentTypes {
    NewUserCompleteProfile: typeof NewUserCompleteProfileComponent;
  }
}
