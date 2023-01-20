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
  'project-management-gfi': {
    eagOccupations: ['Project management/ Program management', 'Alternative proteins'],
    tagId: 'sXXqo3rbghiNW7SwN', // Animal product alternatives
    logo: 'https://80000hours.org/wp-content/uploads/2021/05/good-food-institute-160x160.png',
    occupation: 'alternative proteins',
    feedbackLinkPrefill: 'Executive+Assistant+at+GFI',
    bitlyLink: "https://efctv.org/3Xqa86C", // https://gfi.org/job/?gh_jid=6554883002
    role: 'Executive Assistant, Science and Technology',
    insertThe: true,
    org: 'Good Food Institute',
    orgLink: '/topics/good-food-institute',
    salary: '$63,046',
    location: 'Remote, USA',
    deadline: moment("02-01-2023", "MM-DD-YYYY"),
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        The <a href="https://gfi.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          Good Food Institute (GFI)
        </a> is a nonprofit that works with scientists, investors, and entrepreneurs to produce <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/cultivated-meat")} innerHTML="cultivated meat"/>
        </span> and plant-based <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/animal-product-alternatives")} innerHTML="alternatives"/>
        </span> to animal products.
      </div>
      <div className={classes.description}>
        Ideal candidates have:
        <ul>
          <li>A minimum of four years' applicable work experience (previous administrative experience preferred)</li>
          <li>Demonstrated experience working with projects in project management software</li>
          <li>Strong attention to detail and a high degree of organization and efficiency</li>
        </ul>
      </div>
    </>
  },
  'engineering-anthropic': {
    eagOccupations: ['Software development/Software engineering', 'AI safety technical research'],
    tagId: 'FHE3J3E8qd6oqGZ8a', // Software engineering
    logo: 'https://80000hours.org/wp-content/uploads/2021/06/Anthropic-160x160.jpeg',
    occupation: 'software engineering',
    feedbackLinkPrefill: 'Senior+Software+Engineer+at+Anthropic',
    bitlyLink: "https://efctv.org/3XN8g81", // https://jobs.lever.co/Anthropic/572e187a-8f62-451f-9802-94bd8a52ea90
    role: 'Senior Software Engineer, Developer Experience',
    org: 'Anthropic',
    orgLink: '/topics/anthropic',
    salary: '$270k - $445k',
    location: 'San Francisco, CA',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://www.anthropic.com" target="_blank" rel="noopener noreferrer" className={classes.link}>
          Anthropic
        </a> is an <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/ai-safety")} innerHTML="AI safety"/>
        </span> and research company that's working to build reliable, interpretable, and steerable AI systems.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Have strong instincts for code quality and robustness</li>
          <li>Are comfortable debugging large-scale software systems</li>
          <li>Enjoy close collaboration with engineers and researchers with a variety of backgrounds and expertise</li>
        </ul>
      </div>
    </>
  },
  'finance-founders-pledge': {
    eagOccupations: ['Finance/Accounting'],
    logo: 'https://80000hours.org/wp-content/uploads/2019/06/founders-pledge-160x160.png',
    occupation: 'finance',
    feedbackLinkPrefill: 'Investment+Operations+Manager+at+Founders+Pledge',
    bitlyLink: "https://efctv.org/3ZLIYZE", // https://founders-pledge.jobs.personio.de/job/926945?_pc=959484&display=en
    role: 'Investment Operations Manager',
    org: 'Founders Pledge',
    orgLink: '/topics/founders-pledge',
    salary: 'Up to $110k',
    location: 'Remote, USA',
    roleType: '12 month contract',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://founderspledge.com" target="_blank" rel="noopener noreferrer" className={classes.link}>
          Founders Pledge
        </a> is a nonprofit that encourages entrepreneurs to pledge to donate a portion of their profits to
        effective charities. They are looking for someone to help implement an investment program for their
        global charitable foundation, on a 12-month FTC.
      </div>
      <div className={classes.description}>
        Ideal candidates have:
        <ul>
          <li>Project management experience in either institutional or private wealth management operations</li>
          <li>Understanding of institutional investment practices and portfolio management principles</li>
          <li>Experience with audits and/or accounting (specifically investment accounting)</li>
        </ul>
      </div>
    </>
  },
  'program-management-malaria-consortium': {
    eagOccupations: ['Global health & development', 'Project management/ Program management', 'Communications/Marketing'],
    tagId: 'sWcuTyTB5dP3nas2t', // Global health and development
    logo: 'https://80000hours.org/wp-content/uploads/2019/11/Malaria-Consortium-160x160.png',
    occupation: 'global health & development',
    feedbackLinkPrefill: 'Programme+Design+and+Development+Specialist+at+Malaria+Consortium',
    bitlyLink: "https://efctv.org/3GA1j33", // https://malariaconsortium.current-vacancies.com/Jobs/Advert/2694751?cid=2061&t=Programme-Design-and-Development-Specialist
    role: 'Programme Design and Development Specialist',
    org: 'Malaria Consortium',
    orgLink: '/topics/malaria-consortium',
    salary: '£44,859',
    location: 'London, UK',
    deadline: moment("01-31-2023", "MM-DD-YYYY"),
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://www.malariaconsortium.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          Malaria Consortium
        </a> is a British charity that works on preventing, controlling, and treating <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/malaria")} innerHTML="malaria"/>
        </span> and other communicable diseases in Africa and Asia.
      </div>
      <div className={classes.description}>
        Ideal candidates have:
        <ul>
          <li>A Masters in Public Health, Epidemiology, Development Studies or similar fields, or equivalent practical experience</li>
          <li>Experience in leading the design and writing of successful competitive proposals and tenders for public health programming for commercial bids and for grants</li>
          <li>Experience in managing international health programmes in developing countries</li>
        </ul>
      </div>
    </>
  },
  'ops-arc': {
    eagOccupations: ['Operations', 'AI safety technical research'],
    tagId: 'NNdytpR2E4jYKQCNd', // Operations
    logo: 'https://80000hours.org/wp-content/uploads/2022/01/robotarm_big-160x160.png',
    occupation: 'operations',
    feedbackLinkPrefill: 'Operations+Officer+at+ARC',
    bitlyLink: "https://efctv.org/3CGeuOI", // https://jobs.lever.co/alignment.org/78d8684f-e6f1-4d2a-a220-99d5622422ac
    role: 'Operations Officer',
    insertThe: true,
    org: 'Alignment Research Center',
    orgLink: '/topics/alignment-research-center',
    location: 'Berkeley, CA',
    deadline: moment("01-28-2023", "MM-DD-YYYY"),
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://alignment.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          ARC
        </a> is a non-profit research organization focused on <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/ai-alignment")} innerHTML="AI alignment"/>
        </span>. As part of a new team within ARC, your role will be to build, operate, and maintain systems
        to help them do their work efficiently and effectively.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Are highly organized and adaptable</li>
          <li>Have strong managerial skills and the ability to think strategically in order to guide and support a growing team</li>
          <li>Have a strong interest in AI and AI safety and a strong drive to contribute and make a difference</li>
        </ul>
      </div>
    </>
  },
  'engineering-arc': {
    eagOccupations: ['Software development/Software engineering', 'AI safety technical research'],
    tagId: 'FHE3J3E8qd6oqGZ8a', // Software engineering
    logo: 'https://80000hours.org/wp-content/uploads/2022/01/robotarm_big-160x160.png',
    occupation: 'software engineering',
    feedbackLinkPrefill: 'Generalist+Software+Engineer+at+ARC',
    bitlyLink: "https://efctv.org/3whnarm", // https://jobs.lever.co/alignment.org/d12bfa4a-6958-43f2-aff7-56f6a9651db4
    role: 'Generalist Software Engineer',
    insertThe: true,
    org: 'Alignment Research Center',
    orgLink: '/topics/alignment-research-center',
    location: 'Berkeley, CA',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://alignment.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          ARC
        </a> is a non-profit research organization focused on <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/ai-alignment")} innerHTML="AI alignment"/>
        </span>. The evaluations project is a new team within ARC building capability evaluations for
        advanced ML models, which can enable labs to make measurable safety commitments.
      </div>
      <div className={classes.description}>
        Ideal candidates:
        <ul>
          <li>Can rapidly prototype features and write clear, easy-to-extend code (current stack: React, Typescript, Python, SQL, Flask)</li>
          <li>Have good communication skills, including always asking for clarification if priorities are ambiguous</li>
          <li>Are quick to pick up whatever skills and knowledge are required to make the project succeed</li>
        </ul>
      </div>
    </>
  },
  'ai-research-arc': {
    eagOccupations: ['AI safety technical research'],
    tagId: 'oNiQsBHA3i837sySD', // AI safety
    logo: 'https://80000hours.org/wp-content/uploads/2022/01/robotarm_big-160x160.png',
    occupation: 'AI safety',
    feedbackLinkPrefill: 'Researcher,+Model+Evaluations+at+ARC',
    bitlyLink: "https://efctv.org/3ZqYEkV", // https://jobs.lever.co/alignment.org/51cce9d1-73c7-461c-9d37-4ec1da07a863
    role: 'Researcher, Model Evaluations',
    insertThe: true,
    org: 'Alignment Research Center',
    orgLink: '/topics/alignment-research-center',
    location: 'Berkeley, CA',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        <a href="https://alignment.org" target="_blank" rel="noopener noreferrer" className={classes.link}>
          ARC
        </a> is a non-profit research organization focused on <span className={classes.link}>
          <Components.HoverPreviewLink href={makeAbsolute("/topics/ai-alignment")} innerHTML="AI alignment"/>
        </span>. The evaluations project is a new team within ARC building capability evaluations for
        advanced ML models, which can enable labs to make measurable safety commitments.
      </div>
      <div className={classes.description}>
        Ideal candidates have:
        <ul>
          <li>A solid working knowledge of language model capabilities and modern ML</li>
          <li>A good understanding of alignment risk, in order to identify core risks and translate abstract stories about risk into concrete measurements of existing models</li>
          <li>Strong basic coding skills (able to design and build a system for managing experiments and data)</li>
        </ul>
      </div>
    </>
  },
  'biosecurity-warwick': {
    interestedIn: ['Biosecurity'],
    tagId: 'aELNHEKtcZtMwEkdK', // Biosecurity
    logo: 'https://80000hours.org/wp-content/uploads/2022/12/Warwick-University-160x160.png',
    occupation: 'biosecurity',
    feedbackLinkPrefill: 'PhD+Student+at+University+of+Warwick',
    bitlyLink: "https://efctv.org/3IxWcD3", // https://warwick.ac.uk/fac/cross_fac/igpp/ab101/
    role: 'PhD Student',
    insertThe: true,
    org: 'University of Warwick, Institute for Global Pandemic Planning',
    orgLink: '/posts/gnk3FbdxJjZrrvoGA/link-post-fully-funded-phds-in-pandemic-planning',
    location: 'Warwick, UK',
    getDescription: (classes: ClassesType) => <>
      <div className={classes.description}>
        This is a 4-year fully funded scholarship to work on a PhD in Public Health
        at <a href="https://warwick.ac.uk/fac/cross_fac/igpp/" target="_blank" rel="noopener noreferrer" className={classes.link}>
          IGPP
        </a>, with the option to focus on Behavioural Science, Mathematical Epidemiology,
        Pathogen Diagnostics or Pandemic Response Planning.
      </div>
      <div className={classes.description}>
        General entry requirements for the university:
        <ul>
          <li>At least an upper second class UK honours degree or international equivalent</li>
          <li>Evidence of English language capability</li>
          <li>Two strong academic references</li>
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
    setClosed(true)
    onInterested(showSuccessMsg)
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
        <Button variant="outlined" color="primary" onClick={() => handleUninterested()} className={classes.btn}>
          This doesn't match my interests
        </Button>
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
