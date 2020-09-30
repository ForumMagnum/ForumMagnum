import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useState } from 'react';

import { secondaryInfo } from '../tagging/TagProgressBar';
import { gatherIcon } from '../icons/gatherIcon';
import { divide } from 'lodash';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 10,
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
    display: "flex",
    justifyContent: "space-between",
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
          <div>A private, permanent virtual world for curated community members</div>
          <div>Coworking * 1pm Lunch Hangout</div>
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

