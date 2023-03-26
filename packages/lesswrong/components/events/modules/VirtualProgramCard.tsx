import { registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';
import * as _ from 'underscore';
import Card from '@material-ui/core/Card';
import classNames from 'classnames';
import moment from 'moment';
import { useTracking } from '../../../lib/analyticsEvents';

const styles = createStyles((theme: ThemeType): JssStyles => ({
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
      lineHeight: '1.8em',
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
    color: 'white',
    fontSize: 22,
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
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    paddingBottom: 5,
    marginTop: 10,
    borderBottom: '2px solid transparent'
  },
}))


const VirtualProgramCard = ({program, classes}: {
  program: string,
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking()
  
  // Find the next deadline for applying to the Intro VP, which is usually the 4th Sunday of every month
  // (though it will sometimes move to the 5th Sunday - this is not accounted for in the code).
  // This defaults to the Sunday in the week of the 28th day of this month.
  let deadline = moment().date(28).day(0)
  // If that Sunday is in the past, use next month's 4th Sunday.
  if (deadline.isBefore(moment())) {
    deadline = moment().add(1, 'months').date(28).day(0)
  }
  
  // VP starts 15 days after the deadline, on a Monday
  const startOfVp = moment(deadline).add(15, 'days')
  // VP ends 8 weeks after the start (subtract a day to end on a Sunday)
  const endOfVp = moment(startOfVp).add(8, 'weeks').subtract(1, 'day')

  if (program === 'intro') {
    return <a
      href="https://www.effectivealtruism.org/virtual-programs/introductory-program?utm_source=ea_forum&utm_medium=vp_card&utm_campaign=events_page"
      className={classes.cardLink}
      onClick={() => captureEvent('introVPClicked')}
    >
      <Card className={classNames(classes.eventCard, classes.introVPCard)}>
        <div className={classes.eventCardTime}>
          {startOfVp.format('MMMM D')} - {endOfVp.format('MMMM D')}
        </div>
        <div className={classes.eventCardTitle}>
          Introductory EA Program
        </div>
        <div className={classes.eventCardLocation}>Online</div>
        <div className={classes.eventCardDescription}>
          Explore key ideas in effective altruism through short readings and weekly discussions
        </div>
        <div className={classes.eventCardDeadline}>Apply by Sunday, {deadline.format('MMMM D')}</div>
      </Card>
    </a>
  }
  
  if (program === 'advanced') {
    return <Card className={classes.eventCard}>
      <a
        href="https://www.effectivealtruism.org/virtual-programs/in-depth-program?utm_source=ea_forum&utm_medium=vp_card&utm_campaign=events_page"
        className={classNames(classes.cardLink, classes.cardSection, classes.inDepthSection)}
        onClick={() => captureEvent('inDepthVPClicked')}
      >
        <div>
          <div className={classes.eventCardTime}>
            {startOfVp.format('MMMM D')} - {endOfVp.format('MMMM D')}
          </div>
          <div className={classes.eventCardTitle}>
            In-Depth EA Program
          </div>
          <div className={classes.eventCardDescription}>
            Dive deeper into more complex EA ideas and examine your key uncertainties
          </div>
          <div className={classes.eventCardDeadline}>Apply by Sunday, {deadline.format('MMMM D')}</div>
        </div>
      </a>
      <a
        href="https://www.effectivealtruism.org/virtual-programs/the-precipice-reading-group?utm_source=ea_forum&utm_medium=vp_card&utm_campaign=events_page"
        className={classNames(classes.cardLink, classes.cardSection, classes.precipiceSection)}
        onClick={() => captureEvent('precipiceVPClicked')}
      >
        <div>
          <div className={classes.eventCardTime}>
            {startOfVp.format('MMMM D')} - {endOfVp.format('MMMM D')}
          </div>
          <div className={classes.eventCardTitle}>
            <em>The Precipice</em> Reading Group
          </div>
          <div className={classes.eventCardDescription}>
            Join weekly discussions about existential risks and safeguarding the future of humanity
          </div>
          <div className={classes.eventCardDeadline}>Apply by Sunday, {deadline.format('MMMM D')}</div>
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
