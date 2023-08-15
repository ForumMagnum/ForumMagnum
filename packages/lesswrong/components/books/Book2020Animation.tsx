import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const WIDTH = 220
const HEIGHT = 343
const PADDING = 20

const transitionTime = '.7s'

const revealedContent = (theme: ThemeType) => ({
  '& $one': {
    left: 5,
    top: -20,
    transform: "rotate(-15deg)"
  },
  '& $two': {
    left: 25,
    top: -5,
    transform: "rotate(-5deg)"
  },
  '& $three': {
    left: 45,
    top: 10,
    transform: "rotate(5deg)"
  },
  '& $four': {
    left: 65,
    top: 25,
    transform: "rotate(15deg)"
  },
  '& $revealedContent': {
    opacity: 1,
    transitionDelay: '.5s',
    transition: `opacity .5s ease`
  },
})

const styles = (theme: ThemeType): JssStyles => ({
  parent: {
    position: "relative",
    left: -93,
    transition: 'left 0.7s ease',
    [theme.breakpoints.down('sm')]: {
      left: -60,
    },
    [theme.breakpoints.down('xs')]: {
      left: -30,
    }
  },
  revealedContent: {
    position: 'absolute',
    right: 0,
    opacity: 0,
    transition: `opacity ${transitionTime} ease`,
    width: "calc(100% - 250px)",
    [theme.breakpoints.down('lg')]: {
      opacity: 1
    },
    [theme.breakpoints.down('xs')]: {
      width: "calc(100% - 200px)",
    }
  },
  root: {
    height: HEIGHT + (PADDING * 3.5),
    width: SECTION_WIDTH + 100,
    paddingTop: PADDING,
    paddingBottom: PADDING,
    paddingRight: PADDING,
    [theme.breakpoints.down('sm')]: {
      height: (HEIGHT*.75) + (PADDING * 3.5),
    },
    [theme.breakpoints.down('lg')]: {
      '& $revealedContent': {
        opacity: 1,
      }
    },
    [theme.breakpoints.down('md')]: {
      width: "100%",
    },
    '& $one': {
      left: 0,
      [theme.breakpoints.down('lg')]: {
        left: '60px !important',
        top: '10px !important',
        transform: "rotate(-15deg)"
      }
    },
    '& $two': {
      left: WIDTH + PADDING,
      [theme.breakpoints.down('lg')]: {
        left: '75px !important',
        top: '25px !important',
        transform: "rotate(-5deg)"
      }
    },
    '& $three': {
      left: (WIDTH + PADDING) * 2,
      [theme.breakpoints.down('lg')]: {
        left: '90px !important',
        top: '40px !important',
        transform: "rotate(5deg)"
      }
    },
    '& $four': {
      left: (WIDTH + PADDING) * 3,
      [theme.breakpoints.down('lg')]: {
        left: '105px !important',
        top: '65px !important',
        transform: "rotate(15deg)"
      }
    },
    '&:hover': {
      ...revealedContent(theme),
      [theme.breakpoints.up('lg')]: {
        '& $revealedContent': {
          left: 0
        }
      }
    },
  },
  book: {
    width: WIDTH,
    height: HEIGHT,
    [theme.breakpoints.down('lg')]: {
      width: WIDTH * 0.85,
      height: HEIGHT * 0.85,
    },
    [theme.breakpoints.down('sm')]: {
      width: WIDTH * 0.7,
      height: HEIGHT * 0.7,
    },
    [theme.breakpoints.down('xs')]: {
      width: WIDTH * 0.55,
      height: HEIGHT * 0.55,
    },
    borderRadius: '2px',
    position: "absolute",
    transition: `${transitionTime} ease`,
    boxShadow: "-2px 2px 6px rgba(0,0,0,0.1)",
    top: 0
  },
  one: {},
  two: {},
  three: {},
  four: {}
})

const Book2020Animation = ({ classes, children }: {
  classes: ClassesType,
  children: ReactNode,
}) => {
  const { query } = useLocation();
  const success = !!query.success
  return (
    <div className={classNames(classes.root, {[classes.success]: success})}>
      <div className={classes.parent}>
        <img className={classNames(classes.book, classes.one)} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1691622592/coordination-constraint_w5obih.png" />
        <img className={classNames(classes.book, classes.two)}src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1691622593/alignment-agency-cover_nvzux7.png" />
        <img className={classNames(classes.book, classes.three)} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1691622595/timelines-takeoff-cover_wnb0nc.png" />
        <img className={classNames(classes.book, classes.four)}src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1691623651/reality-reason_llvcqx.png" />
      </div>
      <div className={classes.revealedContent}>
        { children}
      </div>
    </div>
  )
}


const Book2020AnimationComponent = registerComponent('Book2020Animation', Book2020Animation, {
  styles,
  // This component tries to look like a printed book, which is white, so its colors
  // don't change in dark mode
  allowNonThemeColors: true,
});

declare global {
  interface ComponentTypes {
    Book2020Animation: typeof Book2020AnimationComponent
  }
}
