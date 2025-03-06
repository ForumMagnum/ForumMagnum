import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { moderationEmail } from '../../lib/publicSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import Error404 from "@/components/common/Error404";
import { Typography } from "@/components/common/Typography";
import { ContentStyles } from "@/components/common/ContentStyles";

const styles = (theme: ThemeType) => ({
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
  button: {
    background: theme.palette.primary.main,
    borderRadius: 3,
    color: theme.palette.text.invertedBackgroundText,
    display: "block",
    width: 300,
    padding: 16,
    marginTop: 36,
    textAlign: "center",
    fontWeight: 600,
    marginLeft: "auto",
    marginRight: "auto"
  }
})

const WalledGardenHome = ({classes}: {classes: ClassesType<typeof styles>}) => {
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
  const email = moderationEmail.get()
  
  return <SingleColumnSection>
    <ContentStyles contentType="post">
      <Typography variant="display3">
        Walled Garden
      </Typography>
      <p>
        Walled Garden is a virtual world hosted on <a href="https://gather.town/">gather.town</a>. You control an avatar who can walk around, videochatting with other nearby avatars. It was created to enable social interaction during the 2020 pandemic, and continues getting some use as a place people host online meetups.
      </p>
      <p>
        Come visit! Reconnect with old friends, make new ones. And if you're keen to stretch your legs, take a virtual walk together through the waterfalls or explore the abandoned (for now) university campus.
      </p>
      <a href="https://app.gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus"><div className={classes.button}>Click to enter the Garden</div></a><br/>
      <h2>A Culture of Truth-Seeking</h2><p>As a home for Rationalists, the Garden will have a culture of truth-seeking. Inhabitants should reflect on their thought-processes, embody these <a href="https://lesswrong.com/posts/7ZqGiPHTpiDMwqMN2/twelve-virtues-of-rationality">12 virtues of Rationality</a> (and others), and generally try to be right rather than Right.
      </p>
      <h2>Garden Etiquette</h2>
      <ul><li>Please wear headphones.</li><li>Conversations are by default public. Feel free to listen in!</li><li>However, ask "may I join" before jumping in. You may be told, "listen for a bit and join once you are caught up."</li><li>If a conversation is in a distant or secluded spot, it might be private. Ask before listening in. It's always okay to ask!</li></ul>
      
      <h2>Garden Norms</h2>
      <ul>
        <li>All interactions are voluntary! Feel free to tap out of any conversation.</li>
        <li>Be mindful of the experience of others.</li>
        <li>Contact the Garden Wardens (LW team) at <a href={`mailto:${email}`}>{email}</a> or Intercom if someone is bothering you or if you have any other concerns.
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
    </ContentStyles>
  </SingleColumnSection>
}

const WalledGardenHomeComponent = registerComponent("WalledGardenHome", WalledGardenHome, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenHome: typeof WalledGardenHomeComponent
  }
}

export default WalledGardenHomeComponent;

