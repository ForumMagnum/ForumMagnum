import { gql, useMutation } from "@apollo/client";
import { Button, Checkbox, FormControlLabel, TextField, Typography } from "@material-ui/core";
import React, { useState } from "react";
import { forumTypeSetting, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMessages } from "../common/withMessages";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: 'white',
    padding: theme.spacing.unit * 6
  },
  title: {
    marginTop: 0
  },
  section: {
    marginTop: theme.spacing.unit * 6
  },
  sectionHelperText: {
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    fontSize: '1rem'
  },
  submitButtonSection: {
    marginTop: theme.spacing.unit * 3
  }
});

type NewUserCompleteProfileProps = {
  classes: ClassesType
}

const NewUserCompleteProfile: React.FC<NewUserCompleteProfileProps> = ({ classes }) => {
  // TODO: Prefill with existing username if it's not an email?
  const [username, setUsername] = useState('')
  const [subscribeToDigest, setSubscribeToDigest] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [updateUser] = useMutation(gql`
    mutation NewUserCompleteProfile($username: String!, $subscribeToDigest: Boolean!) {
      NewUserCompleteProfile(username: $username, subscribeToDigest: $subscribeToDigest) {
        username
        slug
        displayName
      }
    }
  `, {refetchQueries: ['getCurrentUser']})
  const {flash} = useMessages();
  const {SingleColumnSection} = Components

  async function validateUsername(username: string): Promise<void> {
    if (username.length === 0) {
      setValidationError('Please enter a username')
      return
    }
    if (username.length > 70) {
      setValidationError('username too long')
      return
    }
    // TODO: Really want them to be able to tell live if their username is
    // taken, but I think that's gonna have to be a later PR.
    // if (usernameIsUnique) ...
    setValidationError('')
  }
  
  async function handleSave() {
    try {
      await updateUser({variables: {username, subscribeToDigest}})
      // No errors were thrown, reset form
      setUsername('')
      setSubscribeToDigest(false)
    } catch (err) {
      flash(`${err}`)
    }
  }
  
  return <SingleColumnSection>
      <div className={classes.root}>
      <Typography variant='display3' gutterBottom className={classes.title}>
        Thanks for registering for {siteNameWithArticleSetting.get()}
      </Typography>
      <Typography variant='body2'>
        Please take a second to complete your profile
      </Typography>
      <div className={classes.section}>
        <Typography variant='display1' gutterBottom>Please choose a username</Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          This is the name that people will see when you post or comment.
        </Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          We encourage you to use your real name, because this will help other
          people in the community to identify you, but you can choose a pseudonym
          if you'd prefer.
        </Typography>
        <TextField 
          label='Username'
          helperText='Spaces and special characters allowed'
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onBlur={(_event) => validateUsername(username)}
        />
      </div>
      
      {forumTypeSetting.get() === 'EAForum' && <div className={classes.section}>
        <Typography variant='display1' gutterBottom>Would you like to get digest emails?</Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          The EA Forum Digest is a weekly summary of the best content, curated by
          Aaron Gertler from the Forum's moderation team.
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
      {!!validationError && <Typography variant='body1' color='error' gutterBottom>
        {validationError}
      </Typography>}
      {/* TODO: Something about bio? */}
      <div className={classes.submitButtonSection}>
        <Button
          onClick={handleSave}
          color='primary'
          variant='outlined'
          disabled={!!validationError}
        >
          Save
        </Button>
      </div>
    </div>
  </SingleColumnSection>
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
