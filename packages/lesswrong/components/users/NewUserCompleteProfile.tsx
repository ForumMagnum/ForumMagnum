import { Button, Checkbox, FormControlLabel, TextField, Typography } from "@material-ui/core";
import React, { useState } from "react";
import { forumTypeSetting, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";

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
    fontSize: `1rem`
  },
  submitButtonSection: {
    marginTop: theme.spacing.unit * 3
  }
});

type NewUserCompleteProfileProps = {
  currentUser: UsersCurrent
  classes: ClassesType
}

const NewUserCompleteProfile: React.FC<NewUserCompleteProfileProps> = ({ currentUser, classes }) => {
  const [displayName, setDisplayName] = useState('')
  const [subscribeToDigest, setSubscribeToDigest] = useState(false)
  const {SingleColumnSection} = Components
 
  async function handleSave () {
    console.log({displayName, subscribeToDigest})
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
        <Typography variant='display1' gutterBottom>Please choose a display name</Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          This is the name that people will see when you post or comment.
        </Typography>
        <Typography variant='body1' className={classes.sectionHelperText} gutterBottom>
          We encourage you to use your real name, because this will help other
          people in the community to identify you, but you can choose a pseudonym
          if you'd prefer.
        </Typography>
        <TextField 
          label='Display name'
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
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
      <div className={classes.submitButtonSection}>
        <Button onClick={handleSave} color='primary' variant='outlined'>Save</Button>
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
