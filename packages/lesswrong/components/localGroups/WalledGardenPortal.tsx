import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";
import { postBodyStyles } from '../../themes/stylePiping'
import { DatabasePublicSetting } from '../../lib/publicSettings';

export const gardenOpenToPublic = new DatabasePublicSetting<string>('gardenOpenToPublic', false)

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

/* TO DO LIST
* - link parsing for shared links
* - query whether host is in Garden
* - Sidebar: office-hours, create new event, add calendar to own, share invite-link
*
* Flows:
* 1) full member -> page renders normally
* 2) garden set to open (for weekend): fully open message and renders for all
* 3) has link: a) event link, event currently running ? render : "sorry, event is over"
* b) event is personal code, host in garden? render : "sorry, host is not in the garden"
*
* */

function validateInviteCode(code: string) {
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

  const innerPortal = (onboarded:boolean)  => {
    return <div>
      { onboarded
        ? <div className={classes.iframePositioning}>
            <iframe className={classes.iframeStyling} src="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus"></iframe>
        </div>
        : <SingleColumnSection className={classes.welcomeText}>
          <p>Welcome to the Walled Garden, a curated space for truthseekers!&nbsp;</p>
          <p>Here you can socialize, co-work, play games, and attend events. The Garden is open to everyone on Sundays from 12pm to 4pm PT. Otherwise, it is open by invite only.</p>
          <ul>
            <li>Please wear headphones, preferably with a microphone!</li>
            <li>Technical Problems? Restart your browser.</li>
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
    <p>It is closed right now. Please return on Sunday between noon and 4pm PT, when it is open to everyone. If you have a non-Sunday invite, you may need to <LoginPopupButton><b>Log In</b></LoginPopupButton>.</p>
  </SingleColumnSection>
}


const WalledGardenPortalComponent = registerComponent("WalledGardenPortal", WalledGardenPortal, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortal: typeof WalledGardenPortalComponent
  }
}
