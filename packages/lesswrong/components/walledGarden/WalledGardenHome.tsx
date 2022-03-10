import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  body: {
    ...theme.typography.body1,
    ...postBodyStyles(theme)
  },
  users: {
    background: theme.palette.panelBackground.default,
    padding: 20,
  },
  usersList: {
    columns: 3,
    columnWidth: 225,
    columnGap: 0,
  },
  user: {
    marginBottom: 6,
    ...theme.typography.body2,
    ...theme.typography.commentStyle
  },
})

const WalledGardenHome = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection, Error404, Typography } = Components
  const currentUser = useCurrentUser()
  const { results: users, totalCount } = useMulti({
    terms: {
      view: "walledGardenInvitees",
      limit: 500
    },
    fragmentName: "UsersMinimumInfo",
    collectionName: "Users",
    enableTotal: true,
  })

  if (!currentUser || !currentUser.walledGardenInvite) { return <Error404/> }

  return <SingleColumnSection>
    <div className={classes.body}>
      <Typography variant="display3">
        Walled Garden
      </Typography>
      <p>
        <a href="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus"><strong>Link to the Garden</strong></a><br/>
      </p>
      <p>
        There are many kinds of important social interactions; and not all of those can be achieved on a scheduled Zoom call or from behind a keyboard. Even before the pandemic, it was challenging to make all the worthwhile conversations happen.
      </p>
      <p>
        To address this, The LessWrong team is experimenting with a permanent, virtual world for rationalists. The vision to provide an always-available, 24/7 communal hub where you can socialize, cowork, play games, and attend events.
      </p>
      <p>
        We’re calling it <strong>The Walled Garden</strong>. The plan is to only invite folks if we trust them to embody the virtues, norms, and culture of the LessWrong/Rationality community at its best. &nbsp;If you're seeing this, we invited you with that in mind. <i>Please don't share the password.</i>
      </p>
      <p>
        Come visit! Reconnect with old friends, make new ones. And if you're keen to stretch your legs, take a virtual walk together through the waterfalls or explore the abandoned (for now) university campus.
      </p>
      <p>
        <strong>The Garden is open 24/7</strong></p>
      <ul>
        <li>Schelling socializing hours at 1pm and 7pm PT</li>
        <li>Schelling co-working hours between 2pm-7pm PT</li>
      </ul>
      <h2>A Culture of Truth-Seeking</h2><p>As a home for Rationalists, the Garden will have a culture of truth-seeking. Inhabitants should reflect on their thought-processes, embody these <a href="https://lesswrong.com/posts/7ZqGiPHTpiDMwqMN2/twelve-virtues-of-rationality">12 virtues of Rationality</a> (and others), and generally try to be right rather than Right.
      </p>
      <h2>Garden Etiquette</h2>
      <ul><li>Please wear headphones.</li><li>Conversations are by default public. Feel free to listen in!</li><li>However, ask "may I join" before jumping in. You may be told, "listen for a bit and join once you are caught up."</li><li>If a conversation is in a distant or secluded spot, it might be private. Ask before listening in. It's always okay to ask!</li></ul>
      
      <h2>Garden Norms</h2>
      <ul>
        <li>All interactions are voluntary! Feel free to tap out of any conversation.</li>
        <li>Be mindful of the experience of others.</li>
        <li>Contact the Garden Wardens (LW team) at <a href="mailto:team@lesswrong.com">team@lesswrong.com</a> or Intercom if someone is bothering you or if you have any other concerns.
          <ul>
            <li>Even if it's minor and you don't want anything done, hearing about small things helps us track trends.</li>
          </ul>
        </li>
      </ul>
      
      <h2>Technical Problems?</h2>
      <ul>
        <li>Most problems can be fixed by refreshing. Restarting your browser or computer can also help.</li>
        <li>GatherTown works best on Desktop.</li>
        <li>The <i>gear icon </i>(bottom middle) can be used to change your audio/video input.</li>
        <li>If you get lost, you can click on the <i>gear-icon </i>and select <i>Respawn </i>to jump back to the starting place.</li>
      </ul>
      <div className={classes.users}>
        <h2>Garden Members ({totalCount})</h2>
        <div className={classes.usersList}>
          {users && users.map(user=><div className={classes.user} key={user._id}>
            {user.displayName}
          </div>)}
        </div>
      </div>
    </div>
  </SingleColumnSection>
}

const WalledGardenHomeComponent = registerComponent("WalledGardenHome", WalledGardenHome, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenHome: typeof WalledGardenHomeComponent
  }
}

