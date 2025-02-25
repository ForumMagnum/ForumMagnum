import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import EmailIcon from '@material-ui/icons/Email';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
  },
  icon: {
    height: 13,
    position: "relative",
    top: 1
  },
});

export const NewUserDMSummary = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList,
}) => {
  const { LWTooltip } = Components;
  
  if (!user.usersContactedBeforeReview?.length) return null
  
  return <div className={classes.root}>
    <LWTooltip title={'Number of users DMed'}>
      {user.usersContactedBeforeReview.length} <EmailIcon className={classes.icon}/>
    </LWTooltip>
  </div>
}

const NewUserDMSummaryComponent = registerComponent('NewUserDMSummary', NewUserDMSummary, {styles});

declare global {
  interface ComponentTypes {
    NewUserDMSummary: typeof NewUserDMSummaryComponent
  }
}
