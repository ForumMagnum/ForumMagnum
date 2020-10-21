import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";
import { postBodyStyles } from '../../themes/stylePiping'
import { DatabasePublicSetting, gatherTownRoomId, gatherTownRoomName, gardenOpenToPublic } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme) => ({
  welcomeText: {
    ...postBodyStyles(theme)
  },
  iframePositioning: {
    position: "absolute",
    width: "100%",
    top: 0,
    zIndex: theme.zIndexes.gatherTownIframe,
  },
  iframeStyling: {
    width: "100%",
    height: "100vh",
    border: "none",
  }
})

function validateInviteCode(code: string) {
  // TODO: Stub. Implement real thing.
  if (!code) return false
  return (code.length > 3)
}

const WalledGardenPortal = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection, LoginPopupButton, AnalyticsTracker } = Components
  const { query } = useLocation();
  const { inviteCode } = query;
  const currentUser = useCurrentUser();


  const isOpenToPublic = gardenOpenToPublic.get()

  const [onboarded, setOnboarded] = useState(false);

  const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

  const innerPortal = (onboarded:boolean)  => {
    return <div>
      { onboarded
        ? <div className={classes.iframePositioning}>
            <iframe className={classes.iframeStyling} src={gatherTownURL}></iframe>
        </div>
        : <SingleColumnSection className={classes.welcomeText}>
          <p>Welcome to the Walled Garden, a curated space for truthseekers!&nbsp;</p>
          <p>Here you can socialize, co-work, play games, and attend events. The Garden is open to everyone on Sundays from 12pm to 4pm PT. Otherwise, it is open by invite only.</p>
          <ul>
            <li>Please wear headphones, preferably with a microphone! (<Link to="/posts/DEe5cvpaTQeF9kkru/tips-for-the-most-immersive-video-calls">Tips on audio setup</Link>)</li>
            <li>Technical Problems? Refresh the tab.</li>
            <li>Lost or stuck? Respawn (<i>gear icon</i> &gt; <i>respawn</i>)</li>
            <li>Interactions are voluntary. It's okay to leave conversations.</li>
            <li>Please report any issues, both technical and social, to the LessWrong team via Intercom (bottom right) or
              email (team@lesswrong.com).
            </li>
          </ul>
          <AnalyticsTracker eventType="walledGardenEnter" captureOnMount eventProps={{isOpenToPublic, inviteCode, isMember: currentUser?.walledGardenInvite}}>
            <a onClick={() => setOnboarded(true)}>
              <b>Enter the Garden</b>
            </a>
          </AnalyticsTracker>
        </SingleColumnSection>
      }
    </div>
  }

  if (currentUser?.walledGardenInvite) {
    return innerPortal(onboarded)
  }

  if (isOpenToPublic) {
    return innerPortal(onboarded)
  }

  if (validateInviteCode(inviteCode)) {
    return innerPortal(onboarded)
  }

  return <SingleColumnSection className={classes.welcomeText}>
    <p>The Walled Garden is a private virtual space managed by the LessWrong team.</p>
<p>It is closed right now. Please return on Sunday between noon and 4pm PT, when it is open to everyone. If you have a non-Sunday invite, you may need to {currentUser ? 'log in' : <LoginPopupButton><b>Log In</b></LoginPopupButton>}.</p>
  </SingleColumnSection>
}


const WalledGardenPortalComponent = registerComponent("WalledGardenPortal", WalledGardenPortal, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortal: typeof WalledGardenPortalComponent
  }
}
