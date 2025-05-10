import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { LWTooltip } from "../../common/LWTooltip";

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

export const NewUserDMSummaryInner = ({classes, user}: {
  classes: ClassesType<typeof styles>,
  user: SunshineUsersList,
}) => {
  if (!user.usersContactedBeforeReview?.length) return null
  
  return <div className={classes.root}>
    <LWTooltip title={'Number of users DMed'}>
      {user.usersContactedBeforeReview.length} <EmailIcon className={classes.icon}/>
    </LWTooltip>
  </div>
}

export const NewUserDMSummary = registerComponent('NewUserDMSummary', NewUserDMSummaryInner, {styles});


