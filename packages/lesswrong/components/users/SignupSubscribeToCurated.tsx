import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Checkbox from '@material-ui/core/Checkbox';
import Info from '@material-ui/icons/Info';
import Tooltip from '@material-ui/core/Tooltip';
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    marginBottom: 10,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    marginTop: 4
  },
  checkbox: {
    paddingLeft: 0,
    paddingTop: 0,
    paddingBottom: 0,
    paddingRight: 6,
  },
  infoIcon: {
    width: 16,
    height: 16,
    verticalAlign: "middle",
    color: "rgba(0,0,0,.4)",
    marginLeft: 6,
  },
});

const SignupSubscribeToCurated = ({ defaultValue, onChange, classes }: {
  defaultValue: boolean,
  onChange: (checked: boolean)=>void,
  classes: ClassesType,
}) => {
  const [checked, setChecked] = useState(defaultValue);

  // this component is not used in the EA Forum signup flow,
  // but it does appear on the EA Forum via RecentDiscussionSubscribeReminder.tsx
  const emailType = forumTypeSetting.get() === 'EAForum' ?
    'the EA Forum weekly digest email' : 'Curated posts';

  return <div className={classes.root}>
    <Checkbox
      checked={checked}
      className={classes.checkbox}
      onChange={(ev, newChecked) => {
        setChecked(newChecked)
        onChange(newChecked)
      }}
    />
    Subscribe to {emailType}
    {forumTypeSetting.get() !== 'EAForum' && (
      <Tooltip title="Emails 2-3 times per week with the best posts, chosen by the LessWrong moderation team.">
        <Info className={classes.infoIcon}/>
      </Tooltip>
    )}
  </div>
}

const SignupSubscribeToCuratedComponent = registerComponent('SignupSubscribeToCurated', SignupSubscribeToCurated, {styles});

declare global {
  interface ComponentTypes {
    SignupSubscribeToCurated: typeof SignupSubscribeToCuratedComponent
  }
}
