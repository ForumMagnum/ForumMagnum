import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import moment from '../../lib/moment-timezone';
import { gardenOpenToPublic } from './GatherTown';
import { useMulti } from "../../lib/crud/withMulti";
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { isMobile } from "../../lib/utils/isMobile";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import qs from 'qs'
import {useTagBySlug} from "../tagging/useTag";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import LoginPopupButton from "@/components/users/LoginPopupButton";
import AnalyticsTracker from "@/components/common/AnalyticsTracker";
import WalledGardenMessage from "@/components/walledGarden/WalledGardenMessage";
import GatherTownIframeWrapper from "@/components/walledGarden/GatherTownIframeWrapper";
import WalledGardenPortalBar from "@/components/walledGarden/WalledGardenPortalBar";
import GardenEventDetails from "@/components/walledGarden/GardenEventDetails";
import ContentItemBody from "@/components/common/ContentItemBody";
import { ContentStyles } from "@/components/common/ContentStyles";

const toggleEventsOffset = "330px"

const styles = (theme: ThemeType) => ({
  root: {
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
    color: theme.palette.text.invertedBackgroundText4,
    ...theme.typography.commentStyle,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    textShadow: `0 0 10px ${theme.palette.greyAlpha(.8)}`
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
    fontSize: "1.6rem",
    padding: 20
  },
  buttonStyling: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16
  },
  body: {
    marginTop: 20
  }
})


const WalledGardenPortal = ({ classes }: { classes: ClassesType<typeof styles> }) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser()
  const isOpenToPublic = gardenOpenToPublic.get()

  const { query } = useLocation();
  const navigate = useNavigate();
  const { code: inviteCodeQuery, entered } = query;
  const enteredQuery = entered === "true"

  const [ hideBar, setHideBar ] = useState(false);

  const { results } = useMulti({
    skip: !inviteCodeQuery,
    terms: {
      code: inviteCodeQuery
    },
    collectionName: "GardenCodes",
    fragmentName: "GardenCodeFragment",
    limit: 1,
  });

  const gardenCode = (results && results.length > 0 && (results[0] as HasIdType)._id) ? results[0] as FragmentTypes["GardenCodeFragment"] | null : null
  
  const { tag: onboardingText } = useTagBySlug("garden-onboarding", "TagFragment")
  
  const validateGardenCode = (gardenCode: GardenCodeFragment | null) => {
    return !gardenCode?.deleted && moment().isBetween(gardenCode?.startTime, gardenCode?.endTime)
  }
  const moreThanFourHoursAfterCodeExpiry = useCallback((gardenCode: GardenCodeFragment | null) =>
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
  const afMembershipMismatch = gardenCode?.afOnly && !currentUser?.groups.includes("alignmentForum")
  const userIsAllowed = (currentUser?.walledGardenInvite || isOpenToPublic || codeIsValid) && !afMembershipMismatch

  if (!userIsAllowed) {
    const codeExpiredDuringSession = onboarded && expiredGardenCode
    const codeExpiredBeforeSession = moment(gardenCode?.endTime).isBefore(new Date())
    const codeNotYetValid = moment(gardenCode?.startTime).isAfter(new Date())
    const deletedOrMalformedCode = (!!inviteCodeQuery && !gardenCode)

    // Code is only for AF user and current user isn't logged in or is not an AF user
    if (afMembershipMismatch) return <WalledGardenMessage>
      <p>This event is only for AI Alignment Forum members.</p>
      {!currentUser && <p>If you have an AI Alignment Forum account, please log in with your account.</p>}
    </WalledGardenMessage>

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
      <ContentStyles contentType="post">
        <p>The Walled Garden is a virtual space managed by the LessWrong team.</p>
        <p>If you have an event invite link, please use that to enter. If you have been granted full-access, to {currentUser ? 'log in' : <LoginPopupButton><b>Log In</b></LoginPopupButton>}.</p>
      </ContentStyles>
    </SingleColumnSection>
  }

  const enterGardenButton = <AnalyticsTracker eventType="walledGardenEnter" captureOnMount eventProps={{ isOpenToPublic, inviteCodeQuery, isMember: currentUser?.walledGardenInvite }}>
      <div className={classes.enterButton}>
        <a className={classes.buttonStyling} onClick={ async () => {
          setOnboarded(true)
          navigate({pathname: "/walledGardenPortal", search: `?${qs.stringify({...query, entered: true})}`})
          if (currentUser && !currentUser.walledGardenPortalOnboarded) {
            void updateCurrentUser({
              walledGardenPortalOnboarded: true
            })
          }
        }}>
          <b>ENTER THE GARDEN</b>
        </a>
      </div>
    </AnalyticsTracker>
  
  if ((!!gardenCode && !enteredQuery) || (!!currentUser && !onboarded)){
    return <SingleColumnSection className={classes.root}>
      <ContentStyles contentType="post">
      <h2><strong>Welcome to the Walled Garden, a curated space for truthseekers!</strong></h2>
      {!!gardenCode && <div>
        {codeIsValid ?
          <p>Your invite code to <strong>{gardenCode.title}</strong> is valid (and will be for next many hours).</p> :
          <p>You have reached the Garden via an invite code that is not currently valid.</p>
        }
        {currentUser?.walledGardenInvite && <p>Of course, as a Walled Garden member, you may enter anytime. :)</p>}
        {!currentUser?.walledGardenInvite && isOpenToPublic && <p>However, the Garden is currently to the public, so you may enter anyway! :)</p>}
      </div>}
      {!!gardenCode && <div className={classes.eventDetails}>
        <p><strong>EVENT DETAILS</strong> <em>May contain important instructions</em></p>
        <GardenEventDetails gardenCode={gardenCode}/>
      </div>
      }
      {enterGardenButton}
      <ContentItemBody
        className={classes.body}
        dangerouslySetInnerHTML={{__html: onboardingText?.description?.html || ""}}
        description={`tag ${onboardingText?.name}`}
      />
      {enterGardenButton}
      </ContentStyles>
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

export default WalledGardenPortalComponent;
