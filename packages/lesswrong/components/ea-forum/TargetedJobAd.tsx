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
  jobAdLogo: {
    flex: 'none',
    width: 54,
    marginTop: 20,
    [theme.breakpoints.down('xs')]: {
      width: 40,
    }
  },
  jobAdBodyCol: {
    flexGrow: 1,
    marginBottom: 6,
    [theme.breakpoints.down('xs')]: {
      marginBottom: 4
    }
  },
  jobAdTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 10,
  },
  jobAdLabel: {
    alignSelf: 'flex-start',
    flexGrow: 1,
    display: 'flex',
    columnGap: 8,
    color: theme.palette.grey[500],
  },
  jobAdLabelText: {
    whiteSpace: 'pre',
    letterSpacing: 0.5,
    fontSize: 11,
    fontStyle: 'italic'
  },
  jobAdInfoIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
  },
  jobAdFeedbackLink: {
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
  jobAdHeader: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 18,
    color: theme.palette.grey[700],
    margin: '0 0 3px'
  },
  jobAdLink: {
    color: theme.palette.primary.main
  },
  jobAdMetadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 30,
    rowGap: '3px'
  },
  jobAdMetadata: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 4,
    fontSize: 13,
    color: theme.palette.grey[600],
  },
  jobAdMetadataIcon: {
    fontSize: 12,
  },
  jobAdReadMore: {
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.primary.main,
    padding: 0,
    marginTop: 10,
    '&:hover': {
      opacity: 0.5
    },
  },
  jobAdOrgDescription: {
    maxWidth: 600,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    margin: '10px 0',
    '& ul': {
      margin: 0
    }
  },
  jobAdPrompt: {
    maxWidth: 600,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[900],
    fontWeight: '500',
    marginTop: 14,
    marginBottom: 10
  },
  jobAdBtn: {
    // color: theme.palette.text.alwaysWhite,
    textTransform: 'none',
    boxShadow: 'none',
    marginBottom: 4
  }
});

const HIDE_JOB_AD_COOKIE = 'hide_job_ad'
const SOFTWARE_ENG_TAG_ID = 'FHE3J3E8qd6oqGZ8a'//'CGameg7coDgLbtgdH'

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
  
  const registerInterest = () => {
    // TODO
    flash({messageString: "Thanks for registering interest!", type: "success"})
  }
  
  const { HoverPreviewLink, LWTooltip } = Components
  
  if (cookies[HIDE_JOB_AD_COOKIE] || !currentUser?.profileTagIds.includes(SOFTWARE_ENG_TAG_ID)) {
    return null
  }

  return <div className={classes.root}>
      <img src="https://80000hours.org/wp-content/uploads/2019/07/Metaculus-160x160.jpeg" className={classes.jobAdLogo} />
      <div className={classes.jobAdBodyCol}>
        <div className={classes.jobAdTopRow}>
          <div className={classes.jobAdLabel}>
            <div className={classes.jobAdLabelText}>
              Job  recommendation
            </div>
            <LWTooltip title="We think you should consider this role because it's probably more impactful than your current job.">
              <InfoIcon className={classes.jobAdInfoIcon} />
            </LWTooltip>
          </div>
          <div className={classes.jobAdFeedbackLink}>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdGyKmZRZHqdhEc70QNIzOTKy_j1aMEByGhE_HtciSNMUSJTA/viewform" target="_blank" rel="noopener noreferrer">Give us feedback</a>
          </div>
          <Tooltip title="Dismiss">
            <Button className={classes.closeButton} onClick={dismissJobAd}>
              <CloseIcon className={classes.closeIcon} />
            </Button>
          </Tooltip>
        </div>
        <h2 className={classes.jobAdHeader}>
          {/* TODO: replace with bitly link */}
          <a href="https://apply.workable.com/metaculus/j/409AECAA94/" target="_blank" rel="noopener noreferrer" className={classes.jobAdLink}>
            Full-stack engineer
          </a> at <span className={classes.jobAdLink}>
            <HoverPreviewLink href="/topics/metaculus" innerHTML="Metaculus" />
          </span>
        </h2>
        <div className={classes.jobAdMetadataRow}>
          <div className={classes.jobAdMetadata}>
            $70k - $120k
          </div>
          <div className={classes.jobAdMetadata}>
            <LocationIcon className={classes.jobAdMetadataIcon} />
            Remote
          </div>
        </div>
        {!expanded && <button onClick={handleReadMore} className={classes.jobAdReadMore}>Read more</button>}
        
        {expanded && <>
          <div className={classes.jobAdOrgDescription}>
            Metaculus is an online forecasting platform and aggregation engine working to improve human reasoning and coordination on topics of global importance.
          </div>
          <div className={classes.jobAdOrgDescription}>
            Ideal candidates:
            <ul>
              <li>Have experience shipping features end-to-end (CSS, angular/react, API, & Python/Django)</li>
              <li>Can quickly prototype and deploy functionality</li>
              <li>Are interested in forecasting the future of humanity</li>
            </ul>
          </div>
          <div className={classes.jobAdPrompt}>
            If you're interested in this role, would you like us to pass along your EA Forum profile to the hiring manager?
          </div>
          <Button variant="contained" color="primary" onClick={registerInterest} className={classes.jobAdBtn}>
            Yes, I'm interested
          </Button>
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
