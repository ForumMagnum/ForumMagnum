import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';

import { secondaryInfo } from '../tagging/TagProgressBar';
import { gatherIcon } from '../icons/gatherIcon';
import { LWEvents } from '../../lib/collections/lwevents';
import { useMulti } from '../../lib/crud/withMulti';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

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
  usersOnlineList: {
    ...secondaryInfo(theme),
    justifyContent: 'flex-start',
    marginTop: 0
  },
  icon: {
    marginRight: 24
  },
  onlineDot: {
    color: theme.palette.primary.main,
    width: '0.5em',
    height: '0.5em',
    position: 'relative',
    top: 2
  },
  userNames: {
    marginLeft: 5,
    display: 'flex',
    gap: '5px'
  }
})

const GatherTown = ({classes}: {
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms: {
      view: "gatherTownUsers",
      limit: 1,
    },
    collection: LWEvents,
    fragmentName: 'lastEventFragment',
    enableTotal: false,
  });
  const users = results && results[0]?.properties?.gatherTownUsers
  return (
    <div className={classes.root}>
      <div className={classes.icon}>{gatherIcon} </div>
      <div>
        <div>You're invited to the <a href="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus">Walled Garden</a></div>
        <div className={classes.secondaryInfo}>
          <div>A private, permanent virtual world. Coworking 12pm-6pm PT weekdays. Social hours at 1pm and 6pm.</div>
        </div>
        {users && <div className={classes.usersOnlineList}>
            Users Online: <span className={classes.userNames}>
            {Object.keys(users).map(user => <span key={user}><FiberManualRecordIcon className={classes.onlineDot}/> {user}</span>)}
          </span>
        </div>}
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

