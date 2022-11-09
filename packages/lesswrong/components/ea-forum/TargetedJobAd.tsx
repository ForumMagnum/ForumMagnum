import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import moment from 'moment';
import Button from '@material-ui/core/Button'
import LocationIcon from '@material-ui/icons/LocationOn'
import CloseIcon from '@material-ui/icons/Close'
import InfoIcon from '@material-ui/icons/Info'
import { Link } from '../../lib/reactRouterWrapper';
import { useTracking } from '../../lib/analyticsEvents';
import { useCookies } from 'react-cookie';
import Tooltip from '@material-ui/core/Tooltip';
import { useMessages } from '../common/withMessages';
import { useCurrentUser } from '../common/withUser';
import { useCreate } from '../../lib/crud/withCreate';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: 20,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.typography.fontFamily,
    padding: '6px 15px 10px 20px',
    marginTop: 3,
    [theme.breakpoints.down('xs')]: {
      columnGap: 12,
      padding: '6px 10px',
    }
  },
  logo: {
    flex: 'none',
    width: 54,
    marginTop: 20,
    [theme.breakpoints.down('xs')]: {
      width: 40,
    }
  },
  bodyCol: {
    flexGrow: 1,
    marginBottom: 6,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 4
    }
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 10,
  },
  label: {
    alignSelf: 'flex-start',
    flexGrow: 1,
    display: 'flex',
    columnGap: 8,
    color: theme.palette.grey[500],
  },
  labelText: {
    whiteSpace: 'pre',
    letterSpacing: 0.5,
    fontSize: 11,
    fontStyle: 'italic'
  },
  infoIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
  },
  feedbackLink: {
    fontSize: 12,
    color: theme.palette.link.primaryDim,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  closeButton: {
    padding: '.25em',
    minHeight: '.75em',
    minWidth: '.75em',
  },
  closeIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
  },
  header: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 18,
    color: theme.palette.grey[700],
    margin: '0 0 3px'
  },
  link: {
    color: theme.palette.primary.main
  },
  metadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 30,
    rowGap: '3px'
  },
  metadata: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 4,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  metadataIcon: {
    fontSize: 12,
  },
  readMore: {
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.primary.main,
    padding: 0,
    marginTop: 10,
    '&:hover': {
      opacity: 0.5
    },
  },
  orgDescription: {
    maxWidth: 600,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    margin: '10px 0',
    '& ul': {
      margin: 0
    }
  },
  prompt: {
    maxWidth: 600,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[900],
    fontWeight: '500',
    marginTop: 14,
    marginBottom: 10
  },
  btnRow: {
    marginBottom: 4
  },
  btn: {
    // color: theme.palette.text.alwaysWhite,
    textTransform: 'none',
    boxShadow: 'none',
  }
});

const HIDE_JOB_AD_COOKIE = 'hide_job_ad'
// const SOFTWARE_ENG_TAG_ID = 'FHE3J3E8qd6oqGZ8a'

// for testing purposes, this points to the "Forecasting" topic on the dev db
const SOFTWARE_ENG_TAG_ID = 'CGameg7coDgLbtgdH'

const TargetedJobAd = ({
  classes,
}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking()
  const { flash } = useMessages()
  const [cookies, setCookie] = useCookies([HIDE_JOB_AD_COOKIE])
  const [expanded, setExpanded] = useState(false)
  
  // the AdvisorRequests collection is set to be deleted anyway, so reuse it for this job ad test,
  // as a way to track which users have registered interest in the Metaculus job
  const { create: registerInterest } = useCreate({
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
  })
  const { count, loading } = useMulti({
    terms: {view: 'requestsByUser', userId: currentUser?._id, limit: 1},
    collectionName: 'AdvisorRequests',
    fragmentName: 'AdvisorRequestsMinimumInfo',
    skip: !currentUser
  })
  
  const dismissJobAd = () => {
    captureEvent('hideJobAd')
    setCookie(
      HIDE_JOB_AD_COOKIE,
      "true", {
      expires: moment().add(30, 'days').toDate(),
    })
  }
  
  const handleReadMore = () => {
    captureEvent('expandJobAd')
    setExpanded(true)
  }
  
  const handleRegisterInterest = async () => {
    if (!currentUser) return
    await registerInterest({
      data: {userId: currentUser._id, interestedInMetaculus: true}
    })
    flash({messageString: "Thanks for registering interest!", type: "success"})
  }
  
  const { HoverPreviewLink, LWTooltip } = Components
  
  if (loading || count || cookies[HIDE_JOB_AD_COOKIE] || !currentUser?.profileTagIds.includes(SOFTWARE_ENG_TAG_ID)) {
    return null
  }

  return <div className={classes.root}>
      <img src="https://80000hours.org/wp-content/uploads/2019/07/Metaculus-160x160.jpeg" className={classes.logo} />
      <div className={classes.bodyCol}>
        <div className={classes.topRow}>
          <div className={classes.label}>
            <div className={classes.labelText}>
              Job  recommendation
            </div>
            <LWTooltip title="We think you should consider this role because it's probably more impactful than your current job.">
              <InfoIcon className={classes.infoIcon} />
            </LWTooltip>
          </div>
          <div className={classes.feedbackLink}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdGyKmZRZHqdhEc70QNIzOTKy_j1aMEByGhE_HtciSNMUSJTA/viewform" target="_blank" rel="noopener noreferrer">Give us feedback</a>
          </div>
          <Tooltip title="Dismiss">
            <Button className={classes.closeButton} onClick={dismissJobAd}>
              <CloseIcon className={classes.closeIcon} />
            </Button>
          </Tooltip>
        </div>
        <h2 className={classes.header}>
          {/* TODO: replace with bitly link */}
          <a href="https://apply.workable.com/metaculus/j/409AECAA94/" target="_blank" rel="noopener noreferrer" className={classes.link}>
            Full-stack engineer
          </a> at <span className={classes.link}>
            <HoverPreviewLink href="/topics/metaculus" innerHTML="Metaculus" />
          </span>
        </h2>
        <div className={classes.metadataRow}>
          <div className={classes.metadata}>
            $70k - $120k
          </div>
          <div className={classes.metadata}>
            <LocationIcon className={classes.metadataIcon} />
            Remote
          </div>
        </div>
        {!expanded && <button onClick={handleReadMore} className={classes.readMore}>Read more</button>}
        
        {expanded && <>
          <div className={classes.orgDescription}>
            Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.
          </div>
          <div className={classes.orgDescription}>
            Ideal candidates:
            <ul>
              <li>Have experience shipping features end-to-end (CSS, Angular/React, API, & Python/Django)</li>
              <li>Can quickly prototype and deploy functionality</li>
              <li>Are interested in forecasting the future of humanity</li>
            </ul>
          </div>
          <div className={classes.prompt}>
            If you're interested in this role, would you like us to pass along your EA Forum profile to the hiring manager?
          </div>
          <div className={classes.btnRow}>
            <Button variant="contained" color="primary" onClick={handleRegisterInterest} className={classes.btn}>
              Yes, I'm interested
            </Button>
          </div>
          <button onClick={() => setExpanded(false)} className={classes.readMore}>Show less</button>
        </>}
      </div>
    </div>
}

const TargetedJobAdComponent = registerComponent("TargetedJobAd", TargetedJobAd, {styles});

declare global {
  interface ComponentTypes {
    TargetedJobAd: typeof TargetedJobAdComponent
  }
}
