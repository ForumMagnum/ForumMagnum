import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from "../../lib/routeUtil";
import { postBodyStyles } from '../../themes/stylePiping'
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import moment from '../../lib/moment-timezone';
import { gardenOpenToPublic } from './GatherTown';
import { useMulti } from "../../lib/crud/withMulti";
import {useUpdate} from "../../lib/crud/withUpdate";
import Users from "../../lib/vulcan-users";
import { isMobile } from "../../lib/utils/isMobile";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

const styles = (theme: ThemeType): JssStyles => ({
  messageStyling: {
    ...postBodyStyles(theme),
    marginTop: "100px"
  },
  innerPortalPositioning: {
    position: "absolute",
    top: 0,
    width: "100vw",
    height: "100vh",
    zIndex: theme.zIndexes.gatherTownIframe,
    display: 'flex',
    flexDirection: 'column',
    overflow: "hidden"
  },
  portalBarPositioning: {
    width: "100%",
    flex: 1
  },
  toggleEvents: {
    position: "absolute",
    bottom: 0,
    color: "rgba(255,255,255,.8)",
    ...theme.typography.commentStyle,
    display: "flex",
    alignItems: "center",
    cursor: "pointer"
  },
  closeIcon: {
    height: 48,
    width:48,
  },
  iframeWrapper: {
    flex: 7,
    position: "relative",
  }
})


const WalledGardenPortal = ({ classes }: { classes: ClassesType }) => {

  const { SingleColumnSection, LoginPopupButton, AnalyticsTracker, WalledGardenMessage, GatherTownIframeWrapper, WalledGardenPortalBar } = Components
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  })
  const isOpenToPublic = gardenOpenToPublic.get()

  const { query } = useLocation();
  const { code: inviteCodeQuery } = query;

  const [ hideBar, setHideBar ] = useState(false);

  const { results } = useMulti({
    terms: {
      view: "gardenCodeByCode",
      code: inviteCodeQuery
    },
    collection: GardenCodes,
    fragmentName: "GardenCodeFragment",
    limit: 1,
  });

  const gardenCode = (results && results.length > 0 && (results[0] as HasIdType)._id) ? results[0] as FragmentTypes["GardenCodeFragment"] | null : null

  const validateGardenCode = (gardenCode: GardenCodeFragment | null) => {
    return !gardenCode?.deleted && moment().isBetween(gardenCode?.startTime, gardenCode?.endTime)
  }
  const moreThanFourHoursAfterCodeExpiry = useCallback((gardenCode) =>
    moment(gardenCode?.endTime).add(4, 'hours').isBefore(new Date())
    , [])

  const [onboarded, setOnboarded] = useState(currentUser?.walledGardenPortalOnboarded||false);
  const [expiredGardenCode, setExpiredGardenCode] = useState(moreThanFourHoursAfterCodeExpiry(gardenCode));
  const iframeRef = useRef<HTMLIFrameElement|null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setExpiredGardenCode(moreThanFourHoursAfterCodeExpiry(gardenCode)) //kick someone out 4 hours after code-entry expiry
    }, 1000 * 10);
    return () => clearInterval(interval)
  }, [setExpiredGardenCode, moreThanFourHoursAfterCodeExpiry, gardenCode]);


  if (isMobile()) return <WalledGardenMessage>
    <p>You have reached the Walled Garden Portal. Unfortunately, this page does not work on mobile. Please re-visit from a desktop broswer.</p>
  </WalledGardenMessage>

  const codeIsValid = validateGardenCode(gardenCode)
  const userIsAllowed = currentUser?.walledGardenInvite || isOpenToPublic || codeIsValid


  if (!userIsAllowed) {
    const codeExpiredDuringSession = onboarded && expiredGardenCode
    const codeExpiredBeforeSession = moment(gardenCode?.endTime).isBefore(new Date())
    const codeNotYetValid = moment(gardenCode?.startTime).isAfter(new Date())
    const deletedOrMalformedCode = (!!inviteCodeQuery && !gardenCode)

    //Access Denied Messages
    if (codeExpiredDuringSession) return <WalledGardenMessage>
      <p>Our apologies, your invite link has now expired (actually several hours ago, but we hate to rush people).</p>
      <p>We hope you had a really great time! :)</p>
    </WalledGardenMessage>

    if (codeNotYetValid) return <WalledGardenMessage>
      <p>Your invite code is for an event that has yet started! Please come back at <strong>{moment(gardenCode?.startTime).format("dddd, MMMM Do, h:mma")}</strong></p>
    </WalledGardenMessage>

    if (codeExpiredBeforeSession) return <WalledGardenMessage>
      <p>Unfortunately, your invite code is for an event that has already ended. Please request another link from your host or return when the Garden is open to the public on Sunday between 12pm and 4pm PT.
      </p>
    </WalledGardenMessage>

    if (deletedOrMalformedCode) return <WalledGardenMessage>
      <p>Unfortunately, your invite link to the Garden is not valid.
      Please request another link from your host or return when the Garden is open to the public on Sundays between 12pm and 4pm PT.
      </p>
    </WalledGardenMessage>

    //Default Access Denied Message
    return <SingleColumnSection className={classes.messageStyling}>
      <p>The Walled Garden is a private virtual space managed by the LessWrong team.</p>
      <p>It is closed right now. Please return on Sunday between noon and 4pm PT, when it is open to everyone. If you have a non-Sunday invite, you may need to {currentUser ? 'log in' : <LoginPopupButton><b>Log In</b></LoginPopupButton>}.</p>
    </SingleColumnSection>
  }

  if (!onboarded) {
    return <SingleColumnSection className={classes.messageStyling}>
      {!!gardenCode && <div>
        <p>
          Congratulations! Your invite code to <strong>{gardenCode.title}</strong> is valid (and will be for next many hours).
          Please take a look at our guidelines below, then join the party!
        </p>
        <hr />
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
      <AnalyticsTracker eventType="walledGardenEnter" captureOnMount eventProps={{ isOpenToPublic, inviteCodeQuery, isMember: currentUser?.walledGardenInvite }}>
        <a onClick={ async () => {
          setOnboarded(true)
          if (currentUser && !currentUser.walledGardenPortalOnboarded) {
          void updateUser({
            selector: {_id: currentUser._id},
            data: {
              walledGardenPortalOnboarded: true
            }
          })
        }
        }
        }>
          <b>Enter the Garden</b>
        </a>
      </AnalyticsTracker>
    </SingleColumnSection>
  }


  return <div className={classes.innerPortalPositioning}>
    <div className={classes.iframeWrapper}>
      {hideBar ? 
        <div className={classes.toggleEvents} onClick={() => setHideBar(false)}>
          <ExpandLessIcon className={classes.closeIcon}/>
          Show Footer
        </div>
        :
        <div className={classes.toggleEvents} onClick={() => setHideBar(true)}>
          <ExpandMoreIcon className={classes.closeIcon}/>
          Hide Footer
        </div>
      }
      <GatherTownIframeWrapper  iframeRef={iframeRef}/>
    </div>
    {!hideBar && <div className={classes.portalBarPositioning}>
      <WalledGardenPortalBar iframeRef={iframeRef}/>
    </div>}
  </div>
}


const WalledGardenPortalComponent = registerComponent("WalledGardenPortal", WalledGardenPortal, { styles });

declare global {
  interface ComponentTypes {
    WalledGardenPortal: typeof WalledGardenPortalComponent
  }
}
