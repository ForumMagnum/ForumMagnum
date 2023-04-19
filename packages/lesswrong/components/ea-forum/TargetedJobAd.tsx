import React, { useState } from 'react';
import { Components, makeAbsolute, registerComponent } from '../../lib/vulcan-lib';
import Button from '@material-ui/core/Button'
import LocationIcon from '@material-ui/icons/LocationOn'
import WorkIcon from '@material-ui/icons/BusinessCenter'
import CloseIcon from '@material-ui/icons/Close'
import InfoIcon from '@material-ui/icons/Info'
import ChevronRight from '@material-ui/icons/ChevronRight';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { useTracking } from '../../lib/analyticsEvents';
import Tooltip from '@material-ui/core/Tooltip';
import TextField from '@material-ui/core/TextField';
import classNames from 'classnames';
import OpenInNew from '@material-ui/icons/OpenInNew';
import moment from 'moment';

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
    // alignSelf: 'flex-end',
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
    lineHeight: '24px',
    color: theme.palette.grey[700],
    margin: '3px 0 5px'
  },
  link: {
    color: theme.palette.primary.main
  },
  metadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 30,
    rowGap: '5px'
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
  deadline: {
    fontWeight: 600,
    color: theme.palette.primary.dark
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
    },
    '& li': {
      marginTop: 4
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
    marginTop: 18,
    marginBottom: 8
  },
  input: {
    width: '100%',
    maxWidth: 400
  },
  btn: {
    textTransform: 'none',
    boxShadow: 'none',
  },
  btnIcon: {
    fontSize: 13,
    marginLeft: 6
  },
})

// list of options from EAG
type EAGOccupation =
  'Academic research'|
  'Operations'|
  'Entrepreneurship'|
  'Policymaking/Civil service'|
  'EA community building/community management'|
  'AI safety technical research'|
  'Software development/Software engineering'|
  'People management'|
  'Education'|
  'Global health & development'|
  'Improving institutional decision making'|
  'Earning to give'|
  'AI strategy & policy'|
  'Project management/ Program management'|
  'Healthcare/Medicine'|
  'Technology'|
  'Grantmaking'|
  'Information security'|
  'Climate change mitigation'|
  'Global coordination & peace-building'|
  'Consulting'|
  'Alternative proteins'|
  'Global mental health & well-being'|
  'Nuclear security'|
  'Politics'|
  'Writing'|
  'Event production'|
  'Product management'|
  'Wild animal welfare'|
  'Biosecurity'|
  'Philanthropy'|
  'Farmed animal welfare'|
  'Communications/Marketing'|
  'HR/People operations'|
  'Global priorities research'|
  'Journalism'|
  'Finance/Accounting'|
  'User experience design/research'|
  'Data science/Data visualization'|
  'Counselling/Social work'|
  'Graphic design'|
  'S-risk'

type JobAdData = {
  standardApplyBtn?: boolean,        // set to show the "Apply now" button instead of "Yes, I'm interested"
  eagOccupations?: EAGOccupation[],  // used to match on EAG experience + interests
  interestedIn?: EAGOccupation[],    // used to match on EAG interests
  tagId?: string,                    // used to match on a topic
  logo: string,                      // url for org logo
  occupation: string,                // text displayed in the tooltip
  feedbackLinkPrefill: string,       // url param used to prefill part of the feedback form
  bitlyLink: string,                 // bitly link to the job ad page
  role: string,
  insertThe?: boolean,               // set if you want to insert a "the" before the org name
  org: string,
  orgLink: string,                   // internal link on the org name
  salary?: string,
  location: string,
  roleType?: string,                 // i.e. part-time, contract
  deadline?: moment.Moment,          // not displayed, only used to hide the ad after this date
  getDescription: (classes: ClassesType) => JSX.Element
}

// job-specific data for the ad
// (also used in the confirmation email, so links in the description need to be absolute)
export const JOB_AD_DATA: Record<string, JobAdData> = {
  'malaria-researcher-givewell': {
    standardApplyBtn: true,
    logo: 'https://cdn.80000hours.org/wp-content/uploads/2017/03/GiveWell_square-160x160.jpg',
    occupation: 'research',
    feedbackLinkPrefill: 'Senior+Malaria+Researcher+at+GiveWell',
    bitlyLink: "https://efctv.org/3J7bY6v", // https://www.givewell.org/about/jobs/research-application
    role: 'Senior Malaria Researcher',
    org: 'GiveWell',
    orgLink: '/topics/givewell',
    salary: '$193k - $209k',
    location: 'Remote',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://www.givewell.org/" target="_blank" rel="noopener noreferrer" className={classes.link}>
          GiveWell
        </a>'s first Senior Malaria Researcher will be responsible for strengthening the quality of the research
        and cost-effectiveness modeling guiding GiveWell's investments in <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/malaria")} innerHTML="malaria"/>
        </span> interventions.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Have a quantitatively-oriented advanced degree and substantial malaria expertise</li>
          <li>Have a proven ability to plan and execute research that holds up over time</li>
          <li>Are highly skilled at analyzing empirical research to solve real-world problems</li>
        </ul>
      </div>
    </>
  },
}

const TargetedJobAd = ({ad, onDismiss, onExpand, onInterested, onUninterested, classes}: {
  ad: string,
  onDismiss: () => void,
  onExpand: () => void,
  onInterested: (showSuccessMsg?: boolean) => void,
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
  
  const handleInterested = (showSuccessMsg?: boolean) => {
    // setClosed(true)
    onInterested(showSuccessMsg)
  }
  
  const handleUninterested = (reason?: string) => {
    setShowUninterestedForm(true)
    onUninterested(reason)
  }
  
  const handleSubmitUninterestedReason = (e: AnyBecauseTodo) => {
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
      <Button variant="contained" color="primary" onClick={() => handleInterested()} className={classes.btn}>
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
  // if the org didn't want us to send them expressions of interest, just link to their standard application form
  else if (adData.standardApplyBtn) {
    ctaSection = <>
      <div className={classes.btnRow}>
        <Button
          variant="contained"
          color="primary"
          href={adData.bitlyLink}
          target="_blank"
          rel="noopener noreferrer"
          className={classes.btn}
          onClick={() => handleInterested(false)}
        >
          Apply now <OpenInNew className={classes.btnIcon} />
        </Button>
        {/* <Button variant="outlined" color="primary" onClick={() => handleUninterested()} className={classes.btn}>
          This doesn't match my interests
        </Button> */}
      </div>
    </>
  }

  return <div className={classNames(classes.root, {[classes.rootClosed]: closed})}>
      <img src={adData.logo} className={classes.logo} />
      <div className={classes.bodyCol}>
        <div className={classes.topRow}>
          <div className={classes.label}>
            <div className={classes.labelText}>
              Job  recommendation
            </div>
            {/* <LWTooltip title={
              `You're seeing this recommendation because of your interest in ${adData.occupation}.
              We encourage you to consider jobs like this which might increase your impact significantly.`
            }>
              <InfoIcon className={classes.infoIcon} />
            </LWTooltip> */}
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
          <a href={adData.bitlyLink} target="_blank" rel="noopener noreferrer" className={classes.link}>
            {adData.role}
          </a> at{adData.insertThe ? ' the' : ''} <span className={classes.link}>
            <HoverPreviewLink href={adData.orgLink} innerHTML={adData.org} />
          </span>
        </h2>
        <div className={classes.metadataRow}>
          {adData.salary && <div className={classes.metadata}>
            {adData.salary}
          </div>}
          <div className={classes.metadata}>
            <LocationIcon className={classes.metadataIcon} />
            {adData.location}
          </div>
          {adData.roleType && <div className={classes.metadata}>
            <WorkIcon className={classes.metadataIcon} />
            {adData.roleType}
          </div>}
          {
            // display the deadline when it's within 2 days away
            adData.deadline &&
            moment().add(2, 'days').isSameOrAfter(adData.deadline, 'day') &&
            <div className={classNames(classes.metadata, classes.deadline)}>
              Apply by {adData.deadline.format('MMM Do')}
            </div>
          }
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
