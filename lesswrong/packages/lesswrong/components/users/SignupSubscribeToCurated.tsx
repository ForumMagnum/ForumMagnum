import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
// import Checkbox from '@material-ui/core/Checkbox';
import Info from '@material-ui/icons/Info';
// import Tooltip from '@material-ui/core/Tooltip';
import { isLWorAF } from '../../lib/instanceSettings';
// import InputLabel from '@material-ui/core/InputLabel';
import { forumHeaderTitleSetting } from '../common/Header';

const styles = (theme: ThemeType) => ({
  checkboxLabel: {
    ...theme.typography.body2,
    marginBottom: 10,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    marginTop: 4,
    cursor: 'pointer'
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
    color: theme.palette.icon.dim2,
    marginLeft: 6,
  },
});

const SignupSubscribeToCurated = ({ defaultValue, onChange, classes }: {
  defaultValue: boolean,
  onChange: (checked: boolean) => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [checked, setChecked] = useState(defaultValue);

  // this component is not used in the EA Forum signup flow,
  // but it does appear on the EA Forum via RecentDiscussionSubscribeReminder.tsx
  const emailType = isLWorAF ? 
    'Curated posts' : `the ${forumHeaderTitleSetting.get()} weekly digest email`;

  return <div>
    <label className={classes.checkboxLabel}>
      <input
        type="checkbox"
        checked={checked}
        className={classes.checkbox}
        onChange={(ev) => {
          setChecked(ev.target.checked)
          onChange(ev.target.checked)
        }}
      />
      Subscribe to {emailType}
      {isLWorAF && (
        <span title="Emails 2-3 times per week with the best posts, chosen by the LessWrong moderation team.">
          <Info className={classes.infoIcon}/>
        </span>
      )}
    </label>
  </div>
}

const SignupSubscribeToCuratedComponent = registerComponent('SignupSubscribeToCurated', SignupSubscribeToCurated, {styles});

declare global {
  interface ComponentTypes {
    SignupSubscribeToCurated: typeof SignupSubscribeToCuratedComponent
  }
}

export default SignupSubscribeToCuratedComponent;
