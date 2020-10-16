import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = (theme) => ({
  welcomeText: {
    ...commentBodyStyles(theme)
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
  return (code.length > 3)
}


const WalledGardenPortal = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection } = Components
  const { query, params: { slug } } = useLocation();
  const { inviteCode: inviteCodeQuery } = query;
  const currentUser = useCurrentUser();

  const isSunday =  (new Date()).getDay() === 0;
  const hasInvite = currentUser?.walledGardenInvite;
  console.log({hasInvite, isSunday, inviteCodeQuery});

  const [onboarded, setOnboarded] = useState(false);

  const innerPortal = (onboarded:boolean)  => {
    return <div>
      { onboarded
        ? <div className={classes.iframePositioning}>
            <iframe className={classes.iframeStyling} src="https://gather.town/app/aPVfK3G76UukgiHx/lesswrong-campus"></iframe>
        </div>
        : <SingleColumnSection className={classes.welcomeText}>
          <p>Welcome to the Walled Garden, a curated space for truthseekers!&nbsp;</p>
          <p>Here you can socialize, co-work, play games, and attend events. The Garden is open to everyone on Sundays and
            for public events. Otherwise, it is open by invite only.</p>
          <ul>
            <li>Please wear headphones, preferably with a microphone!</li>
            <li>Restart your browser to solve most technical problems.</li>
            <li>Respawn (<i>gear icon</i> &gt; <i>respawn</i>) if you get lost or stuck.</li>
            <li>All interactions are voluntary. You are not compelled to talk to anyone.</li>
            <li>Please report any issues, both technical and social, to the LessWrong team via Intercom (bottom right) or
              email (team@lesswrong.com).
            </li>
          </ul>
          <a onClick={() => setOnboarded(true)}>
            <b>Enter the Garden</b>
          </a>
        </SingleColumnSection>
      }
    </div>
  }

  if (currentUser?.walledGardenInvite) {
    return innerPortal(onboarded)
  }

  if (isSunday) {
    return innerPortal(onboarded)
  }

  if (validateInviteCode(inviteCodeQuery)) {
    return innerPortal(onboarded)
  }

  return <SingleColumnSection className={classes.welcomeText}>
    <p>The Walled Garden is a private virtual space managed by the LessWrong team.</p>
    <p>It is closed right now. Please return on Sunday when it is open to everyone. If you have a non-Sunday invite, you may need to log in.</p>
  </SingleColumnSection>
}


const WalledGardenPortalComponent = registerComponent("WalledGardenPortal", WalledGardenPortal, {styles});

declare global {
  interface ComponentTypes {
    WalledGardenPortal: typeof WalledGardenPortalComponent
  }
}
