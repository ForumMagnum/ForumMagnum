import React, { useState } from 'react';
import {Components, getFragment, registerComponent} from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";
import { postBodyStyles } from '../../themes/stylePiping'
import { DatabasePublicSetting, gatherTownRoomId, gatherTownRoomName } from '../../lib/publicSettings';
import { Link } from '../../lib/reactRouterWrapper';
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import { useSingle } from "../../lib/crud/withSingle";
import { ExpandedDate } from "../common/FormatDate";
import moment from '../../lib/moment-timezone';

export const gardenOpenToPublic = new DatabasePublicSetting<boolean>('gardenOpenToPublic', false)

const styles = (theme) => ({
  welcomeText: {
    ...postBodyStyles(theme),
    marginTop: "100px"
  },
  iframePositioning: {
    position: "absolute",
    top: 64,
    // left: 150,
    width: "100%", //"calc(100% - 150px)",
    height: "calc(100vh - 264px)",
    zIndex: theme.zIndexes.gatherTownIframe,
  },
  iframeStyling: {
    width: "100%",
    height: "100%",
    border: "none"
  },
  inviteCodeWidget: {
    position: "absolute",
    left: "50px",
    width: "500px"
  }
})


function validateGardenCode(gardenCode: GardenCodeFragment | null ) {
  return !gardenCode?.deleted && moment().isBetween(gardenCode?.startTime, gardenCode?.endTime)
}

const WalledGardenPortal = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection, LoginPopupButton, AnalyticsTracker, GardenCodeWidget } = Components
  const currentUser = useCurrentUser();
  const isOpenToPublic = gardenOpenToPublic.get()

  const { query } = useLocation();
  const { inviteCode } = query;

  const { document: gardenCode } = useSingle({
    documentId: inviteCode?.slice(0, 17),
    collection: GardenCodes,
    fragmentName: "GardenCodeFragment"
  })

  const [onboarded, setOnboarded] = useState(false);

  const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

  const innerPortal = (onboarded:boolean)  => {
    return <div>
      { onboarded
        ? <div className={classes.iframePositioning}>
            <iframe className={classes.iframeStyling} src={gatherTownURL} allow={`camera ${gatherTownURL}; microphone ${gatherTownURL}`}></iframe>
          <div className={classes.inviteCodeWidget}>
              {!!currentUser && currentUser.walledGardenInvite && <GardenCodeWidget/>}
            </div>
        </div>
        : <SingleColumnSection className={classes.welcomeText}>
          {!!gardenCode && <p>
            Congratulations! Your invite code to <strong>{gardenCode.title}</strong> is valid until <strong><ExpandedDate date={gardenCode.endTime}/></strong>
            <hr/>
          </p>
          }
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

  if (!!inviteCode && validateGardenCode(gardenCode)) {
    return innerPortal(onboarded)
  }

  if (!!inviteCode && !validateGardenCode(gardenCode)) {
    return <SingleColumnSection className={classes.welcomeText}>
      <p>Unfortunately, your invite link to the Walled Garden is not currently valid. The event period may not yet have begun or may have ended already.</p>
      <p>Please request another link from your host or return when the Garden is open to the public on Sunday between 12pm and 4pm PT.</p>
    </SingleColumnSection>
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
