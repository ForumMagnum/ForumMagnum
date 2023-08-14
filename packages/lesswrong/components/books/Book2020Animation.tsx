import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib';
import { SECTION_WIDTH } from '../common/SingleColumnSection';

const WIDTH = 220
const HEIGHT = 343
const PADDING = 20

const revealedContent = (theme: ThemeType) => ({
  '& $one': {
    left: -20,
    top: -20,
    transform: "rotate(-15deg)"
  },
  '& $two': {
    left: 0,
    top: -5,
    transform: "rotate(-5deg)"
  },
  '& $three': {
    left: 20,
    top: 10,
    transform: "rotate(5deg)"
  },
  '& $four': {
    left: 40,
    top: 25,
    transform: "rotate(15deg)"
  },
  '& $revealedContent': {
    opacity: 1,
    transitionDelay: '0.7s',
    transition: 'opacity 0.7s ease'
  },
})

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    height: HEIGHT + (PADDING * 3.5),
    width: SECTION_WIDTH,
    padding: PADDING,
    '& $one': {
      left: 0,
      [theme.breakpoints.down('sm')]: {
        left: 20,
        top: 30,
        transform: "rotate(-15deg)"
      }
    },
    '& $two': {
      left: WIDTH + PADDING,
      [theme.breakpoints.down('sm')]: {
        left: 20,
        top: 40,
        transform: "rotate(5deg)"
      }
    },
    '& $three': {
      left: (WIDTH + PADDING) * 2,
      [theme.breakpoints.down('sm')]: {
        left: 20,
        top: 50,
        transform: "rotate(5deg)"
      }
    },
    '& $four': {
      left: (WIDTH + PADDING) * 3,
      [theme.breakpoints.down('sm')]: {
        left: 20,
        top: 60,
        transform: "rotate(15deg)"
      }
    },
    '&:hover': {
      // [theme.breakpoints.up('md')]: {
        ...revealedContent(theme)
      // },
    }
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
    borderRadius: '2px',
    position: "absolute",
    transition: '1s ease',
    boxShadow: "-2px 2px 6px rgba(0,0,0,0.1)",
    top: 0
  },
  one: {},
  two: {},
  three: {},
  four: {},
  parent: {
    [theme.breakpoints.up('lg')]: {
      position: "relative",
      transform: "translateX(-50%)",
      left: '50%',
    }
  },
  revealedContent: {
    position: 'absolute',
    right: 0,
    opacity: 0,
    transition: 'opacity 0.5s ease',
    width: 650,
    [theme.breakpoints.down('md')]: {
      opacity: 1
    }
  }
})

const Book2020Animation = ({ classes, children, successContent }: {
  classes: ClassesType,
  children: ReactNode,
  successContent?: any
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
        { success ? (successContent || children) : children}
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
