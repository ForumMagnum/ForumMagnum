import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import {useLocation, useNavigation} from "../../lib/routeUtil";
import { postBodyStyles } from '../../themes/stylePiping'
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import moment from '../../lib/moment-timezone';
import { gardenOpenToPublic } from './GatherTown';
import { useMulti } from "../../lib/crud/withMulti";
import {useUpdate} from "../../lib/crud/withUpdate";
import { isMobile } from "../../lib/utils/isMobile";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import qs from 'qs'
import Button from '@material-ui/core/Button';

const toggleEventsOffset = "330px"

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...postBodyStyles(theme),
    marginTop: "50px",
    display: "flex",
    flexDirection: "column"
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
    left: toggleEventsOffset,
    color: "rgba(255,255,255,.8)",
    ...theme.typography.commentStyle,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    textShadow: "0 0 10px rgba(0,0,0,.8)"
  },
  closeIcon: {
    height: 48,
    width: 48,
  },
  iframeWrapper: {
    flex: 7,
    position: "relative",
  },
  eventDetails: {
    marginTop: 20
  },
  enterButton: {
    display: "flex",
    justifyContent: "flex-end",
    fontSize: "1.6rem"
  },
  buttonStyling: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16
  }
})


const WalledGardenPortal = ({ classes }: { classes: ClassesType }) => {

  const { SingleColumnSection, LoginPopupButton, AnalyticsTracker, WalledGardenMessage, GatherTownIframeWrapper, WalledGardenPortalBar, GardenEventDetails } = Components
  
  const currentUser = useCurrentUser();
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  })
  const isOpenToPublic = gardenOpenToPublic.get()

  const { query, url, currentRoute, location } = useLocation();
  const { history } = useNavigation();
  const { code: inviteCodeQuery, entered: enteredQuery } = query;
  console.log({query, url, currentRoute, location})

  const [ hideBar, setHideBar ] = useState(false);

  const { results } = useMulti({
    terms: {
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
      <p>Your invite code is for an event that has not yet started! Please come back at the start time.</p>
      {!!gardenCode && <GardenEventDetails gardenCode={gardenCode}/>}
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
    return <SingleColumnSection className={classes.root}>
      <p>The Walled Garden is a private virtual space managed by the LessWrong team.</p>
      <p>It is closed right now. Please return on Sunday between noon and 4pm PT, when it is open to everyone. If you have a non-Sunday invite, you may need to {currentUser ? 'log in' : <LoginPopupButton><b>Log In</b></LoginPopupButton>}.</p>
    </SingleColumnSection>
  }

  if ((!!gardenCode && !enteredQuery) || !onboarded){
    return <SingleColumnSection className={classes.root}>
      <h2><strong>Welcome to the Walled Garden, a curated space for truthseekers!</strong></h2>
      {!!gardenCode && <div>
        {codeIsValid ?
          <p>Your invite code to <strong>{gardenCode.title}</strong> is valid (and will be for next many hours).</p> :
          <p>You have reached the Garden via an invite code that is not currently valid. However, as a full Garden Member you may enter anyway. :) </p>
        }
      </div>
      }
      <p><strong>IMPORTANT TECHNICAL INFORMATION</strong>
        <ul>
          <li>Please wear headphones! Try to be in a low-background noise environment.</li>
          <li>Make sure you grant the page access to your camera and microphone. Usually, there are pop-ups but sometimes you have to click an icon within your URL bar.</li>
          <li>The Garden will not load from an incognito window or if 3rd-party cookies are blocked.</li>
          <li>Technical Problems once you're in the Garden? Refresh the tab.</li>
          <li>Lost or stuck? Message a host using chat (left sidebar)</li>
          <li>Interactions are voluntary. It's okay to leave conversations.</li>
          <li>Please report any issues, both technical and social, to the LessWrong team via Intercom (bottom right on most pages) or
            email (team@lesswrong.com).</li>
        </ul>
      </p>
      <AnalyticsTracker eventType="walledGardenEnter" captureOnMount eventProps={{ isOpenToPublic, inviteCodeQuery, isMember: currentUser?.walledGardenInvite }}>
        <div className={classes.enterButton}>
          <a className={classes.buttonStyling} onClick={ async () => {
            setOnboarded(true)
            history.push({pathname: "/walledGardenPortal", search: `?${qs.stringify({...query, entered: true})}`})
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
        </div>
      </AnalyticsTracker>
      {!!gardenCode && <div className={classes.eventDetails}>
        <p><strong>EVENT DETAILS</strong> <em>May contain important instructions</em></p>
        {!!gardenCode && <GardenEventDetails gardenCode={gardenCode}/>}
      </div>
      }
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
