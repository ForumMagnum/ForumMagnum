import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button'
import LocationIcon from '@material-ui/icons/LocationOn'
import CloseIcon from '@material-ui/icons/Close'
import InfoIcon from '@material-ui/icons/Info'
import ChevronRight from '@material-ui/icons/ChevronRight';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { useTracking } from '../../lib/analyticsEvents';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxHeight: 1200, // This is to make the close transition work
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: 20,
    background: theme.palette.panelBackground.default,
    fontFamily: theme.typography.fontFamily,
    padding: '6px 15px 10px 20px',
    [theme.breakpoints.down('xs')]: {
      columnGap: 12,
      padding: '6px 10px',
    }
  },
  rootClosed: {
    opacity: 0,
    visibility: 'hidden',
    paddingTop: 0,
    paddingBottom: 0,
    maxHeight: 0,
    transitionProperty: 'opacity, visibility, padding-top, padding-bottom, max-height',
    transitionDuration: '0.5s',
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
    alignSelf: 'flex-end',
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
    margin: '3px 0'
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
    display: 'flex',
    alignItems: 'center',
    fontFamily: theme.typography.fontFamily,
    background: 'none',
    color: theme.palette.primary.main,
    padding: 0,
    marginTop: 10,
    '&:hover': {
      opacity: 0.5
    },
  },
  readMoreIcon: {
    fontSize: 18
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
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 16,
    rowGap: '12px',
    alignItems: 'baseline',
    marginBottom: 6
  },
  input: {
    maxWidth: '100%',
    width: 400
  },
  btn: {
    textTransform: 'none',
    boxShadow: 'none',
  }
})

export const JOB_AD_DATA = {
  'research-givewell': {
    tagId: 'CGameg7coDgLbtgdH',//'hxRMaKvwGqPb43TWB',
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
  },
  'research-effective-giving': {
    tagId: 'CGameg7coDgLbtgdH',//'hxRMaKvwGqPb43TWB',
    logo: 'https://80000hours.org/wp-content/uploads/2019/12/effective-giving-160x160.png',
    occupation: 'research',
    feedbackLinkPrefill: 'Biosecurity+Program+Associate+at+Effective+Giving',
    bitlyLink: "https://efctv.org/3A16UNq",
    role: 'Biosecurity Program Associate',
    org: 'Effective Giving',
    orgSlug: 'effective-giving-organization',
    salary: '€50k+',
    location: 'Remote (Euro-centric)',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://www.effectivegiving.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          Effective Giving
        </a> is a philanthropic advisory and <span className={classes.link}>
          <Components.HoverPreviewLink href="/topics/grantmaking" innerHTML="grantmaking"/>
        </span> organization.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Have academic or professional experience from a relevant field, such as medicine, biotechnology, public health, or engineering</li>
          <li>Have a high-level understanding of the biosecurity field, including context around existing organizations and efforts</li>
          <li>Have excellent written (English) communication</li>
        </ul>
      </div>
    </>
  },
  'people-ops-open-phil': {
    tagId: 'CGameg7coDgLbtgdH',//TODO: delete
    logo: 'https://80000hours.org/wp-content/uploads/2022/08/OP_Logo-scaled-1-160x160.png',
    occupation: 'people operations',
    feedbackLinkPrefill: 'People+Operations+Generalist+at+Open+Philanthropy',
    bitlyLink: "https://efctv.org/3A16UNq",
    role: 'People Operations Generalist',
    org: 'Open Philanthropy',
    orgSlug: 'open-philanthropy',
    salary: '$104k+',
    location: 'Remote (US-centric)',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://openphilanthropy.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          Open Philanthropy
        </a> is a research and <span className={classes.link}>
          <Components.HoverPreviewLink href="/topics/grantmaking" innerHTML="grantmaking"/>
        </span> organization.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Have at least 2-3 years of operations experience</li>
          <li>Have a track record of taking on poorly scoped projects and proactively getting them over the finish line</li>
          <li>Are intensely detail-oriented</li>
        </ul>
      </div>
    </>
  },
}

const TargetedJobAd = ({ad, onDismiss, onExpand, onInterested, onUninterested, classes}: {
  ad: string,
  onDismiss: () => void,
  onExpand: () => void,
  onInterested: () => void,
  onUninterested: (reason?: string) => void,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()
  // expand/collapse the ad contents
  const [expanded, setExpanded] = useState(false)
  // if the user says this doesn't match their interests, replace the main CTA to ask them why
  const [showUninterestedForm, setShowUninterestedForm] = useState(false)
  // clicking either "interested" or "uninterested" will close the ad
  const [closed, setClosed] = useState(false)
  
  const handleExpand = () => {
    captureEvent('expandJobAd')
    setExpanded(true)
    onExpand()
  }
  
  const handleInterested = () => {
    setClosed(true)
    onInterested()
  }
  
  const handleUninterested = (reason?: string) => {
    setShowUninterestedForm(true)
    onUninterested(reason)
  }
  
  const handleSubmitUninterestedReason = (e) => {
    e.preventDefault()
    setClosed(true)
    onUninterested(e.target.uninterestedReason.value)
  }
  
  const { HoverPreviewLink, LWTooltip } = Components
  
  const adData = JOB_AD_DATA[ad]
  if (!adData) {
    return null
  }
  
  // standard CTA, asking if the user is interested in this role
  let ctaSection = <>
    <div className={classes.prompt}>
      If you're interested in this role, would you like us to pass along your email address and EA Forum profile to the hiring manager?
    </div>
    <div className={classes.btnRow}>
      <Button variant="contained" color="primary" onClick={handleInterested} className={classes.btn}>
        Yes, I'm interested
      </Button>
      <Button variant="outlined" color="primary" onClick={() => handleUninterested()} className={classes.btn}>
        No, this doesn't match my interests
      </Button>
    </div>
  </>
  // if the user said they were uninterested in the role, instead prompt them to tell us why
  if (showUninterestedForm) {
    ctaSection = <form onSubmit={handleSubmitUninterestedReason}>
      <div className={classes.prompt}>
        Why doesn't this role match your interests?
      </div>
      <div className={classes.btnRow}>
        <TextField name="uninterestedReason" className={classes.input} />
        <Button type="submit" variant="contained" color="primary" className={classes.btn}>
          Submit
        </Button>
      </div>
    </form>
  }

  return <div className={classNames(classes.root, {[classes.rootClosed]: closed})}>
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
            <Button className={classes.closeButton} onClick={onDismiss}>
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
        {!expanded ? <button onClick={handleExpand} className={classes.readMore}>
          <ChevronRight className={classes.readMoreIcon} /> Expand
        </button> : <button onClick={() => setExpanded(false)} className={classes.readMore}>
          <ExpandMore className={classes.readMoreIcon} /> Collapse
        </button>}
        
        {expanded && <>
          {adData.getDescription(classes)}
          {ctaSection}
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
