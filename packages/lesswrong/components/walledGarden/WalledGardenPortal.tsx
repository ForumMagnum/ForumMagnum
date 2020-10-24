import React, {useEffect, useState} from 'react';
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
  inviteCodeQueryWidget: {
    position: "absolute",
    left: "50px",
    width: "500px"
  }
})



const WalledGardenPortal = ({classes}:{classes:ClassesType}) => {
  const { SingleColumnSection, LoginPopupButton, AnalyticsTracker, WalledGardenPortalBar } = Components
  const currentUser = useCurrentUser();
  const isOpenToPublic = gardenOpenToPublic.get()

  const { query } = useLocation();
  const { inviteCode: inviteCodeQuery } = query;

  const { document: gardenCode } = useSingle({
    documentId: inviteCodeQuery?.slice(0, 17),
    collection: GardenCodes,
    fragmentName: "GardenCodeFragment"
  })

  const validateGardenCode = (gardenCode: GardenCodeFragment | null ) => {
    return !gardenCode?.deleted && moment().isBetween(gardenCode?.startTime, gardenCode?.endTime)
  }
  const moreThanFourHoursAfterCodeExpiry = (gardenCode) => moment(gardenCode?.endTime).add(4,'hours').isBefore(new Date())

  const [onboarded, setOnboarded] = useState(true);
  const [expiredGardenCode, setExpiredGardenCode] = useState(moreThanFourHoursAfterCodeExpiry(gardenCode));

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiredGardenCode(moreThanFourHoursAfterCodeExpiry(gardenCode)) //kick someone out 4 hours after code-entry expiry
    }, 1000*10);
    return () => clearInterval(interval)
  }, [setExpiredGardenCode, moreThanFourHoursAfterCodeExpiry, gardenCode]);


  // console.log({
  //   gardenCode,
  //   expiredGardenCode,
  //   endTime: gardenCode?.endTime,
  //   now: new Date(),
  //   endTimePlus8: moment(gardenCode?.endTime).add(4,'hours'),
  //   all: moreThanFourHoursAfterCodeExpiry(gardenCode),
  //   validCode: validateGardenCode(gardenCode)
  // })

  const gatherTownURL = `https://gather.town/app/${gatherTownRoomId.get()}/${gatherTownRoomName.get()}`

  const innerPortal = ()  => {

    if (!onboarded)  return <SingleColumnSection className={classes.welcomeText}>
      {!!gardenCode && <div>
        <p>
          Congratulations! Your invite code to <strong>{gardenCode.title}</strong> is valid (and will be for next many hours).
          Please take a look at our guidelines below, then join the party!
        </p>
        <hr/>
      </div>
      }
      <p><strong>Welcome to the Walled Garden, a curated space for truthseekers!</strong></p>
      <p>Here you can socialize, co-work, play games, and attend events. The Garden is open to everyone on Sundays from 12pm to 4pm PT. Otherwise, it is open by invite only.</p>
      <ul>
        <li>Please wear headphones, preferably with a microphone! Try to be in a low-background noise environment.</li>
        <li>Technical Problems? Refresh the tab.</li>
        <li>Lost or stuck? Respawn (<i>gear icon</i> &gt; <i>respawn</i>)</li>
        <li>Interactions are voluntary. It's okay to leave conversations.</li>
        <li>Please report any issues, both technical and social, to the LessWrong team via Intercom (bottom right) or
          email (team@lesswrong.com).</li>
      </ul>
      <AnalyticsTracker eventType="walledGardenEnter" captureOnMount eventProps={{isOpenToPublic, inviteCodeQuery, isMember: currentUser?.walledGardenInvite}}>
        <a onClick={() => setOnboarded(true)}>
          <b>Enter the Garden</b>
        </a>
      </AnalyticsTracker>
    </SingleColumnSection>

  return <div className={classes.iframePositioning}>
        <iframe className={classes.iframeStyling} src={gatherTownURL} allow={`camera ${gatherTownURL}; microphone ${gatherTownURL}`}></iframe>
          <div className={classes.inviteCodeQueryWidget}>
              {!!currentUser && currentUser.walledGardenInvite && <WalledGardenPortalBar/>}
            </div>
        </div>

  }

  //Access Granted Cases
  if (currentUser?.walledGardenInvite) return innerPortal()

  if (isOpenToPublic) return innerPortal()

  if (validateGardenCode(gardenCode)) return innerPortal()

  //Access Denied Cases
  if (onboarded && expiredGardenCode) return <SingleColumnSection> {/*they had a valid code that then expired while they are in the Garden – onboarded is only true if they'd been granted access, expiredGardenCode == true 4 hours after code expiry */}
    <p>Our apologies, your invite link has now expired (actually several hours ago, but we hate to rush people).</p>
    <p>We hope you had a really great time! :)</p>
  </SingleColumnSection>

  if (moment(gardenCode?.startTime).isAfter(new Date())) return <SingleColumnSection className={classes.welcomeText}>
    <p>Your invite code is for an event that has yet started! Please come back at <strong><ExpandedDate date={gardenCode?.startTime}/></strong></p>}
  </SingleColumnSection>

  if (moment(gardenCode?.endTime).isBefore(new Date())) return <SingleColumnSection className={classes.welcomeText}>
    <p>Unfortunately, your invite code is for an event that has already ended.
      Please request another link from your host or return when the Garden is open to the public on Sunday between 12pm and 4pm PT.
    </p>
  </SingleColumnSection>

  if ((!!inviteCodeQuery && !gardenCode) || gardenCode?.deleted) return <SingleColumnSection className={classes.welcomeText}>
    <p>Unfortunately, your invite link to the Garden is not valid.
      Please request another link from your host or return when the Garden is open to the public on Sundays between 12pm and 4pm PT.
      </p>
    </SingleColumnSection>

  return <SingleColumnSection className={classes.welcomeText}> {/*Generic message when no code provided and not open/no invite */}
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
