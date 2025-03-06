import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import * as _ from 'underscore';
import classNames from 'classnames';
import moment from 'moment';
import { useTracking } from '../../../lib/analyticsEvents';
import { useCurrentTime } from '../../../lib/utils/timeUtil';
import { useEAVirtualPrograms } from '@/components/hooks/useEAVirtualPrograms';
import FormatDate from "@/components/common/FormatDate";
import { Card } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
  eventCard: {
    position: 'relative',
    width: 373,
    height: 374,
    borderRadius: theme.borderRadius.default,
    overflow: 'visible',
    boxShadow: theme.palette.boxShadow.eventCard,
    [theme.breakpoints.down('xs')]: {
      maxWidth: '100vw'
    }
  },
  introVPCard: {
    background: "linear-gradient(rgba(0, 87, 102, 0.7), rgba(0, 87, 102, 0.7)), url('https://res.cloudinary.com/cea/image/upload/w_374,h_373,c_fill,q_auto,f_auto/Event/pz3xmsm63xl8thlyt2up.jpg')",
    padding: '50px 24px',
    '& .VirtualProgramCard-eventCardDescription': {
      opacity: 1,
      lineHeight: '1.6em',
      marginTop: 30
    },
    '& .VirtualProgramCard-eventCardDeadline': {
      marginTop: 30
    }
  },
  cardLink: {
    '&:hover': {
      opacity: '0.9'
    },
    '&:hover .VirtualProgramCard-eventCardDeadline': {
      borderBottom: '2px solid white'
    }
  },
  cardSection: {
    display: 'flex',
    width: 373,
    height: 243,
    padding: 20,
    overflow: 'hidden'
  },
  inDepthSection: {
    background: "linear-gradient(rgba(0, 87, 102, 0.7), rgba(0, 87, 102, 0.7)), url('https://res.cloudinary.com/cea/image/upload/w_374,h_243,c_fill,q_auto,f_auto/Event/f2cbeqvjyhyl6rhhzdsu.jpg')",
    clipPath: 'polygon(0 0, 100% 0, 100% 54%, 0 100%)',
    borderRadius: `${theme.borderRadius.default}px ${theme.borderRadius.default}px 0 0`,
  },
  precipiceSection: {
    background: "linear-gradient(rgb(168, 114, 51, 0.5), rgb(168, 114, 51, 0.5)), url('https://res.cloudinary.com/cea/image/upload/w_374,h_243,c_fill,q_auto,f_auto/Event/xfhrtorwdxxmplaofqa8.jpg')",
    clipPath: 'polygon(0 46%, 100% 0, 100% 100%, 0 100%)',
    position: 'absolute',
    bottom: 0,
    alignItems: 'flex-end',
    textAlign: 'right',
    borderRadius: `0 0 ${theme.borderRadius.default}px ${theme.borderRadius.default}px`,
  },
  eventCardTime: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: 'white'
  },
  eventCardTitle: {
    ...theme.typography.headline,
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: 'white',
    fontSize: 20,
    fontWeight: 600,
    marginTop: 8,
    marginBottom: 0
  },
  eventCardLocation: {
    ...theme.typography.commentStyle,
    opacity: '0.7',
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
  eventCardDescription: {
    ...theme.typography.commentStyle,
    opacity: '0.7',
    color: 'white',
    fontSize: 14,
    lineHeight: '1.5em',
    marginTop: 10,
  },
  eventCardDeadline: {
    ...theme.typography.commentStyle,
    display: 'inline-block',
    fontWeight: 600,
    color: 'white',
    fontSize: 16,
    paddingBottom: 5,
    marginTop: 10,
    borderBottom: '2px solid transparent'
  },
});

const VirtualProgramCard = ({program, classes}: {
  program: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking();
  const now = useCurrentTime()
  const { deadline, start, end } = useEAVirtualPrograms();
  if (program === 'intro') {
    return <a
      href="https://www.effectivealtruism.org/virtual-programs/introductory-program?utm_source=ea_forum&utm_medium=vp_card&utm_campaign=events_page"
      className={classes.cardLink}
      onClick={() => captureEvent('introVPClicked')}
    >
      <Card className={classNames(classes.eventCard, classes.introVPCard)}>
        <div className={classes.eventCardTime}>
          <FormatDate date={start.toISOString()} format={"MMMM D"} granularity='date' tooltip={false} /> – <FormatDate date={end.toISOString()} format={"MMMM D"} granularity='date' tooltip={false} />
        </div>
        <div className={classes.eventCardTitle}>
          Introductory EA Program
        </div>
        <div className={classes.eventCardLocation}>Online</div>
        <div className={classes.eventCardDescription}>
          Explore key ideas in effective altruism through short readings and weekly discussions
        </div>
        <div className={classes.eventCardDeadline}>Apply by <FormatDate date={deadline.toISOString()} format={"dddd, MMMM D"} granularity='date' tooltip={false} /></div>
      </Card>
    </a>
  }
  
  if (program === 'advanced') {
    // Find the next deadline for applying to the Precipice VP, which is some Sunday every 3 months
    // (as with the Intro/Advanced VP deadline, it will prob sometimes be off by a week or two).
    // The first confirmed deadline is Nov 19, 2023, so we assume the deadlines will be
    // ~the 3rd Sunday in Feb, May, Aug, and Nov each year. Start by checking Feb of this year.
    // NOTE: I changed it to the last Sunday of the prev month since that's what they used for Aug 2024,
    // but that might change back later.
    let precipiceDeadline = moment(now).month(1).date(0).day(0)
    // While that day is in the past, keep adding 3 months.
    while (precipiceDeadline.isBefore(now)) {
      precipiceDeadline = moment(precipiceDeadline).add(3, 'months').date(0).day(0)
    }
    
    // VP starts 22 days after the deadline, on a Monday
    const startOfPrecipice = moment(precipiceDeadline).add(22, 'days')
    // VP ends 8 weeks after the start (subtract a day to end on a Sunday)
    const endOfPrecipice = moment(startOfPrecipice).add(8, 'weeks').subtract(1, 'day')
    
    return <Card className={classes.eventCard}>
      <a
        href="https://www.effectivealtruism.org/virtual-programs/in-depth-program?utm_source=ea_forum&utm_medium=vp_card&utm_campaign=events_page"
        className={classNames(classes.cardLink, classes.cardSection, classes.inDepthSection)}
        onClick={() => captureEvent('inDepthVPClicked')}
      >
        <div>
          <div className={classes.eventCardTime}>
            <FormatDate date={start.toISOString()} format={"MMMM D"} granularity='date' tooltip={false} /> – <FormatDate date={end.toISOString()} format={"MMMM D"} granularity='date' tooltip={false} />
          </div>
          <div className={classes.eventCardTitle}>
            In-Depth EA Program
          </div>
          <div className={classes.eventCardDescription}>
            Dive deeper into more complex EA ideas and examine your key uncertainties
          </div>
          <div className={classes.eventCardDeadline}>Apply by <FormatDate date={deadline.toISOString()} format={"dddd, MMMM D"} granularity='date' /></div>
        </div>
      </a>
      <a
        href="https://www.effectivealtruism.org/virtual-programs/the-precipice-reading-group?utm_source=ea_forum&utm_medium=vp_card&utm_campaign=events_page"
        className={classNames(classes.cardLink, classes.cardSection, classes.precipiceSection)}
        onClick={() => captureEvent('precipiceVPClicked')}
      >
        <div>
          <div className={classes.eventCardTime}>
            <FormatDate date={startOfPrecipice.toISOString()} format={"MMMM D"} granularity='date' tooltip={false} /> – <FormatDate date={endOfPrecipice.toISOString()} format={"MMMM D"} granularity='date' tooltip={false} />
          </div>
          <div className={classes.eventCardTitle}>
            <em>The Precipice</em> Reading Group
          </div>
          <div className={classes.eventCardDescription}>
            Join weekly discussions about existential risks and safeguarding the future of humanity
          </div>
          <div className={classes.eventCardDeadline}>Apply by <FormatDate date={precipiceDeadline.toISOString()} format={"dddd, MMMM D"} granularity='date' tooltip={false} /></div>
        </div>
      </a>
    </Card>
  }
  
  return null
}

const VirtualProgramCardComponent = registerComponent('VirtualProgramCard', VirtualProgramCard, {
  styles,
  
  // This is based around an image, which doesn't get inverted in dark mode
  allowNonThemeColors: true,
});

declare global {
  interface ComponentTypes {
    VirtualProgramCard: typeof VirtualProgramCardComponent
  }
}

export default VirtualProgramCardComponent;
