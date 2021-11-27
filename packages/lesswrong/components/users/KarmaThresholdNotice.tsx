import React from 'react';
import { minNewPostKarmaSetting, minNewCommentKarmaSetting } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: 'white',
    width: '100%',
    padding: 32,
    '& a': {
      color: theme.palette.primary.main,
    },
  },
});

const KarmaThresholdNotice = ({thresholdType, disabledAbility, classes}: {
  thresholdType: string,
  disabledAbility: string,
  classes: ClassesType,
}) => {
  const {Typography } = Components;
  
  const karma_constant = thresholdType === "post" ? minNewPostKarmaSetting.get() : minNewCommentKarmaSetting.get()

  return <div className={classes.root}>
      <Typography variant='body2' gutterBottom>
        Due to your karma score falling below {karma_constant}, your ability to {disabledAbility} has been disabled. <Link to='/contact'>Contact the moderation team</Link> if you have questions.
      </Typography>
    </div>
}

const KarmaThresholdNoticeComponent = registerComponent(
  'KarmaThresholdNotice', KarmaThresholdNotice, {styles}
);

declare global {
  interface ComponentTypes {
    KarmaThresholdNotice: typeof KarmaThresholdNoticeComponent
  }
}
