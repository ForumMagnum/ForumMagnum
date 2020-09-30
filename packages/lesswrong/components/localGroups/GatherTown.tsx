import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

import { secondaryInfo } from '../tagging/TagProgressBar';
import { gatherIcon } from '../icons/gatherIcon';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    display: "flex",
    '& a': {
      color: theme.palette.primary.main
    },
    alignItems: "center"
  },
  secondaryInfo: {
    ...secondaryInfo(theme),
    marginTop: 0,
  },
  icon: {
    marginRight: 24
  }
})

const GatherTown = ({classes}: {
  classes: ClassesType,
}) => {

  return (
    <div className={classes.root}>
      <div className={classes.icon}>{gatherIcon} </div>
      <div>
        <div>You're invited to the <a href="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus">Walled Garden</a></div>
        <div className={classes.secondaryInfo}>
          <div>A private, permanent virtual world. Coworking 12pm-6pm PT weekdays. Social hours at 1pm and 6pm.</div>
        </div>
      </div>
    </div>
  )
}

const GatherTownComponent = registerComponent('GatherTown', GatherTown, {styles});

declare global {
  interface ComponentTypes {
    GatherTown: typeof GatherTownComponent
  }
}

