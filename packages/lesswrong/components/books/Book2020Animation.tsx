import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const WIDTH = 220
const HEIGHT = 343
const PADDING = 20

const transitionTime = '.7s'

const revealedContent = (_theme: ThemeType) => ({
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

const styles = (theme: ThemeType) => ({
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
    [theme.breakpoints.down('xs')]: {
      height: (HEIGHT*.55) + (PADDING * 3.5),
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
      },
      [theme.breakpoints.down('xs')]: {
        top: '-10px !important',
        left: '50px !important',
      }
    },
    '& $two': {
      left: WIDTH + PADDING,
      [theme.breakpoints.down('lg')]: {
        left: '75px !important',
        top: '25px !important',
        transform: "rotate(-5deg)"
      },
      [theme.breakpoints.down('xs')]: {
        top: '-10px !important',
        left: '70px !important',
      }
    },
    '& $three': {
      left: (WIDTH + PADDING) * 2,
      [theme.breakpoints.down('lg')]: {
        left: '90px !important',
        top: '40px !important',
        transform: "rotate(5deg)"
      },
      [theme.breakpoints.down('xs')]: {
        top: '-10px !important',
        left: '90px !important',
      }
    },
    '& $four': {
      left: (WIDTH + PADDING) * 3,
      [theme.breakpoints.down('lg')]: {
        left: '105px !important',
        top: '65px !important',
        transform: "rotate(15deg)"
      },
      [theme.breakpoints.down('xs')]: {
        top: '0px !important',
        left: '120px !important',
      }
    },
    '&:hover': {
      ...revealedContent(theme),
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
      width: WIDTH * 0.4,
      height: HEIGHT * 0.4,
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

const Book2020AnimationInner = ({ classes, children }: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
}) => {
  return (
    <div className={classes.root}>
      <div className={classes.parent}>
        <img className={classNames(classes.book, classes.one)} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320746/coordination-constraint_i8ievm.jpg" />
        <img className={classNames(classes.book, classes.two)} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320745/alignment-agency-cover_ddrtzy.jpg" />
        <img className={classNames(classes.book, classes.three)} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320746/timelines-takeoff-cover_yxfvtw.jpg" />
        <img className={classNames(classes.book, classes.four)} src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320746/reality-reason_r9bpxq.jpg" />
      </div>
      <div className={classes.revealedContent}>
        { children }
      </div>
    </div>
  )
}


export const Book2020Animation = registerComponent('Book2020Animation', Book2020AnimationInner, {
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
