import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button'
import LocationIcon from '@material-ui/icons/LocationOn'
import CloseIcon from '@material-ui/icons/Close'
import InfoIcon from '@material-ui/icons/Info'
import { useTracking } from '../../lib/analyticsEvents';
import Tooltip from '@material-ui/core/Tooltip';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: 20,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.typography.fontFamily,
    padding: '6px 15px 10px 20px',
    marginTop: 2,
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
  description: {
    maxWidth: 570,
    fontSize: 13,
    lineHeight: '20px',
    color: theme.palette.grey[700],
    margin: '10px 0',
    '& ul': {
      margin: 0
    }
  },
  prompt: {
    maxWidth: 570,
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
    textTransform: 'none',
    boxShadow: 'none',
  }
})

const jobAdData = {
  'research-givewell': {
    logo: 'https://80000hours.org/wp-content/uploads/2017/03/GiveWell_square-160x160.jpg',
    occupation: 'research',
    feedbackLinkPrefill: 'Senior+Research+Associate+at+GiveWell',
    bitlyLink: "https://efctv.org/3A16UNq",
    role: 'Senior Research Associate',
    org: 'GiveWell',
    orgSlug: 'givewell',
    salary: '$127k - $140k',
    location: 'Remote (US-centric)',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://www.givewell.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          GiveWell
        </a> is a nonprofit charity evaluator dedicated to finding the most cost-effective giving opportunities
        in <span className={classes.link}>
          <Components.HoverPreviewLink href="/topics/global-health-and-development" innerHTML="global health and development"/>
        </span>.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Have a bachelor's degree (or higher) in a quantitative field such as economics, mathematics, or statistics or equivalent experience (~6 years)</li>
          <li>Are passionate about helping to improve global health and alleviate global poverty as much as possible</li>
          <li>Ask a lot of questions, and are curious, rather than defensive, when interrogating their own or others' work</li>
        </ul>
      </div>
    </>
  }
}

const TargetedJobAd = ({ad, handleDismiss, onExpand, handleRegisterInterest, classes}: {
  ad: string,
  handleDismiss: () => void,
  onExpand: () => void,
  handleRegisterInterest: () => void,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()
  const [expanded, setExpanded] = useState(false)
  
  const handleReadMore = () => {
    captureEvent('expandJobAd')
    setExpanded(true)
    onExpand()
  }
  
  const { HoverPreviewLink, LWTooltip } = Components
  
  const adData = jobAdData[ad]
  if (!adData) {
    return null
  }

  return <div className={classes.root}>
      <img src={adData.logo} className={classes.logo} />
      <div className={classes.bodyCol}>
        <div className={classes.topRow}>
          <div className={classes.label}>
            <div className={classes.labelText}>
              Job  recommendation
            </div>
            <LWTooltip title={
              `You're seeing this recommendation because of your interest in ${adData.occupation}.
              We encourage you to consider jobs like this which might increase your impact significantly.`
            }>
              <InfoIcon className={classes.infoIcon} />
            </LWTooltip>
          </div>
          <div className={classes.feedbackLink}>
            <a href={`
                https://docs.google.com/forms/d/e/1FAIpQLSdPzZlC5AxzqhIRmSQUkDMtrtDJi9RSCazGrQXuvjl2VhHWWQ/viewform?usp=pp_url&entry.70861771=${adData.feedbackLinkPrefill}
              `}
              target="_blank"
              rel="noopener noreferrer"
            >
              Give us feedback on this experiment
            </a>
          </div>
          <Tooltip title="Dismiss">
            <Button className={classes.closeButton} onClick={handleDismiss}>
              <CloseIcon className={classes.closeIcon} />
            </Button>
          </Tooltip>
        </div>
        <h2 className={classes.header}>
          {/* TODO Direct link to job description: https://apply.workable.com/metaculus/j/409AECAA94/ */}
          <a href={adData.bitlyLink} target="_blank" rel="noopener noreferrer" className={classes.link}>
            {adData.role}
          </a> at <span className={classes.link}>
            <HoverPreviewLink href={`/topics/${adData.orgSlug}`} innerHTML={adData.org} />
          </span>
        </h2>
        <div className={classes.metadataRow}>
          <div className={classes.metadata}>
            {adData.salary}
          </div>
          <div className={classes.metadata}>
            <LocationIcon className={classes.metadataIcon} />
            {adData.location}
          </div>
        </div>
        {!expanded && <button onClick={handleReadMore} className={classes.readMore}>Read more</button>}
        
        {expanded && <>
          {adData.getDescription(classes)}
          <div className={classes.prompt}>
            If you're interested in this role, would you like us to pass along your email address and EA Forum profile to the hiring manager?
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
