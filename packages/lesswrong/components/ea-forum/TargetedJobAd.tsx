'use client';

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Button from '@/lib/vendor/@material-ui/core/src/Button'
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close'
import { AnalyticsContext } from '../../lib/analyticsEvents';
import classNames from 'classnames';
import OpenInNew from '@/lib/vendor/@material-ui/icons/src/OpenInNew';
import moment from 'moment';
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { TooltipSpan } from '../common/FMTooltip';
import HoverPreviewLink from "../linkPreview/HoverPreviewLink";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import EAButton from "./EAButton";
import { JOB_AD_DATA } from './constants';

const styles = (theme: ThemeType) => ({
  root: {
    maxHeight: 1200, // This is to make the close transition work
    background: theme.palette.grey[0],
    fontFamily: theme.typography.fontFamily,
    padding: '10px 12px 12px',
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
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
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 5,
  },
  infoIcon: {
    fontSize: 14,
    color: theme.palette.grey[400],
    transform: 'translateY(2px)'
  },
  closeButton: {
    padding: '.25em',
    minHeight: '.75em',
    minWidth: '.75em',
  },
  closeIcon: {
    fontSize: 16,
    color: theme.palette.grey[500],
  },
  mainRow: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: 8,
  },
  logo: {
    flex: 'none',
    width: 36,
    borderRadius: theme.borderRadius.small,
    marginTop: 5,
  },
  bodyCol: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 20,
    rowGap: '10px',
    flexWrap: 'wrap',
  },
  headerRow: {
    marginBottom: 4
  },
  pinIcon: {
    verticalAlign: 'sub',
    width: 16,
    height: 16,
    color: theme.palette.primary.main,
    padding: 1.5,
    marginRight: 8,
  },
  header: {
    display: 'inline',
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
    color: theme.palette.grey[1000],
    margin: '0 0 4px'
  },
  metadataRow: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: '3px',
    color: theme.palette.grey[600],
  },
  metadata: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 3,
    fontSize: 13,
    lineHeight: '17px',
    color: theme.palette.grey[600],
    fontWeight: 500,
  },
  metadataIcon: {
    fontSize: 12,
  },
  feedbackLink: {
    flexGrow: 1,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  reminderBtn: {
    background: 'none',
    fontSize: 13,
    lineHeight: '17px',
    color: theme.palette.grey[600],
    fontWeight: 500,
    fontFamily: theme.typography.fontFamily,
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    padding: 0,
    '&:hover': {
      color: theme.palette.grey[800],
    },
  },
  applyBtn: {
    marginRight: 5,
    marginBottom: 4,
  },
  btnIcon: {
    fontSize: 16,
    marginLeft: 6
  },
})

/**
 * This component only handles the job ad UI. See TargetedJobAdSection.tsx for functional logic.
 */
const TargetedJobAd = ({jobName, userJobAd, onDismiss, onApply, onRemindMe, classes}: {
  jobName: string,
  userJobAd?: UserJobAdsMinimumInfo,
  onDismiss: () => void,
  onApply: () => void,
  onRemindMe: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const adData = JOB_AD_DATA[jobName]
  const now = useCurrentTime();
  if (!adData) {
    return null
  }
  
  // Only show the "Remind me" button if the job's deadline is more than 3 days away
  // and the current user hasn't already set a reminder for this job.
  const showRemindMe = adData.deadline && moment(now).add(3*24, 'hours').isBefore(adData.deadline) && !userJobAd?.reminderSetAt
  
  return <AnalyticsContext pageSubSectionContext="targetedJobAd">
    <div className={classes.root}>

      <div className={classes.topRow}>
        <div className={classes.metadata}>
          Job recommendation for you
          <LWTooltip title={
            `You're seeing this recommendation because of your interest in ${adData.occupation}.`
          }>
            <ForumIcon icon="InfoCircle" className={classes.infoIcon} />
          </LWTooltip>
        </div>
        <div className={classNames(classes.feedbackLink, classes.metadata)}>
          <a href={`
              https://docs.google.com/forms/d/e/1FAIpQLSd4uDGbXbJSwYX2w_9wXNTuLLBf7bhiWoWc-goJJXiWGA7qDg/viewform?usp=pp_url&entry.70861771=${adData.feedbackLinkPrefill}
            `}
            target="_blank"
            rel="noopener noreferrer"
          >
            Give us feedback
          </a>
        </div>
        <TooltipSpan title="Dismiss">
          <Button className={classes.closeButton} onClick={onDismiss}>
            <CloseIcon className={classes.closeIcon} />
          </Button>
        </TooltipSpan>
      </div>

      <div className={classes.mainRow}>
        <img src={adData.logo} className={classes.logo} />
        <div className={classes.bodyCol}>
          
          <div>
            <div className={classes.headerRow}>
              <ForumIcon icon="Pin" className={classes.pinIcon} />
              <h2 className={classes.header}>
                <Link to={adData.bitlyLink} target="_blank" rel="noopener noreferrer">
                  {adData.role}
                </Link> at{adData.insertThe ? ' the ' : ' '}
                <HoverPreviewLink href={adData.orgLink}>
                  {adData.org}
                </HoverPreviewLink>
              </h2>
            </div>
            <div className={classes.metadataRow}>
              {adData.salary && <>
                <div className={classes.metadata}>
                  {adData.salary}
                </div>
                <div>·</div>
              </>}
              <div className={classes.metadata}>
                {adData.location}
              </div>
              {adData.roleType && <>
                <div>·</div>
                <div className={classes.metadata}>
                  {adData.roleType}
                </div>
              </>}
              {adData.deadline && <>
                <div>·</div>
                <div className={classes.metadata}>
                  Deadline: {adData.deadline.format('MMM Do')}
                </div>
                {showRemindMe && <>
                  <div>·</div>
                  <button onClick={onRemindMe} className={classes.reminderBtn}>
                    Remind me
                  </button>
                </>}
              </>}
            </div>
          </div>
          
          <EAButton
            style="grey"
            variant="contained"
            href={adData.bitlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={classes.applyBtn}
            onClick={onApply}
          >
            View job details <OpenInNew className={classes.btnIcon} />
          </EAButton>
        </div>
      </div>
    </div>
  </AnalyticsContext>
}

export default registerComponent("TargetedJobAd", TargetedJobAd, {styles});


