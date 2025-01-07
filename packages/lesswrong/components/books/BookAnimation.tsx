import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib';

const collapsedStyles = (theme: ThemeType) => ({
  [theme.breakpoints.up('lg')]: {
    '& .book-container': {
      left: 'calc(var(--book-animation-left-offset, -100px) + var(--collapsed-position))',
    },
    '& .book': {
      'transform': 'rotateY(90deg)',
    },
    '& .book::after': {
      'opacity': '0',
    },
  },
  '& $revealedContent': {
    opacity: 1,
    transitionDelay: '1s',
    transition: 'opacity 1s ease'
  },
  '&::after': {
    opacity: 1
  },
})

const styles = (theme: ThemeType) => ({
  success: {
    '& .parent-container': {
      ...collapsedStyles(theme)
    }
  },
  root: {
    '& .parent-container': {
      zIndex: '2',
      position: 'relative',
      height: 350,
      paddingLeft: 'calc(var(--book-animation-left-offset, -100px) + 230px)',
    },
    '& .book-container': {
      width: '200px',
      height: '300px',
      'margin-right': '30px',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'perspective': '800px',
      'transition': 'left 1.5s ease',
      'transform-style': 'preserve-3d',
      position: 'absolute',
      left: 'var(--starting-position)',
      top: 0,
      zIndex: 2
    },
    '& .book': {
      transform: 'rotateY(0deg)',
      position: 'relative',
      'transform-style': 'preserve-3d',
      width: '200px',
      height: '300px',
      transition: 'transform 1.5s ease'
    },
    '& .parent-container:hover': {
      ...collapsedStyles(theme)
    },
    '& .parent-container::after': {
      content: '""',
      height: '344px',
      width: 0,
      position: 'absolute',
      left: 'calc(142px + var(--book-animation-left-offset, -100px))',
      top: '-22px',
      background: 'transparent',
      zIndex: -1,
      boxShadow: '5px 23px 100px 15px #666',
      transform: 'translateZ(-500px)',
      transition: 'opacity 1s ease',
      opacity: 0
    },
    [theme.breakpoints.down('md')]: {
      '& .book': {
        'transform': 'rotateY(90deg)'
      },
      '& .book::after': {
        opacity: 0
      },
      '& .parent-container::after': {
        left: '75px',
        opacity: 1,
        top: '25px'
      },
      '& .book-container': {
        left: 'calc(var(--collapsed-position) - 87px)',
        top: 49
      },
      '& .parent-container': {
        paddingLeft: '140px',
        paddingTop: '1px',
        height: 'unset',
        maxWidth: 765,
        minHeight: 375
      }
    },
    [theme.breakpoints.down('xs')]: {
      '& .parent-container': {
        paddingLeft: 0,
        paddingTop: 15,
        overflow: 'hidden',
        minHeight: 350,
      },
      '& .book-container': {
        transform: "scale(0.6, 0.6)",
        left: 'calc(var(--collapsed-position) / 2)',
        height: 150,
        width: 100,
        top: 60
      },
      '& .parent-container::after': {
        left: 85,
        top: 60,
        height: 140,
        boxShadow: "5px 23px 130px 15px #666",
      },
      '& .book': {
        transition: 'transform 0.0s ease',
        transform: "rotateY(60deg)",
      },
    },
    '& .book > .cover': {
      position: 'absolute',
      background: 'white',
      width: '200px',
      height: '300px',
      'border-top-right-radius': '3px',
      'border-bottom-right-radius': '3px'
    },
    '& .book > .spine': {
      background: 'transparent',
      height: '300px',
      width: 'calc(var(--half-spine-width, 14px)*2)',
      position: 'absolute',
      left: 'var(--negative-half-spine-width, -14px)',
      transform: 'rotateY(-90deg) translateX(var(--negative-half-spine-width, -14px))'
    },
    '& .book > .spine-thickness': {
      position: 'absolute',
      height: '300px',
      width: '1px',
      background: 'white',
      transform: 'translateZ(-1px) translateX(1px) rotateY(-45deg)'
    },
    '& .spine::after': {
      content: '""',
      width: '3px',
      background: 'white'
    },
    '& .book::after': {
      content: '""',
      position: 'absolute',
      left: '0',
      width: '200px',
      height: '300px',
      'border-top-right-radius': '3px',
      'border-bottom-right-radius': '3px',
      'background': 'white',
      'transform': 'translateZ(var(--negative-spine-width, -26px))',
      'box-shadow': '5px 0 40px 9px #EEE',
      'z-index': '-1',
      'transition': 'opacity 1s ease'
    },
    '& .epistemology': {
      '--starting-position': '0px',
      '--collapsed-position': '8px',
      '--negative-spine-width': '-19.166px',
      '--half-spine-width': '8.5833px',
      '--negative-half-spine-width': '-8.5833px',
    },

    '& .agency': {
      '--starting-position': '230px',
      '--collapsed-position': '27.166px',
      '--negative-spine-width': '-13px',
      '--half-spine-width': '6.5px',
      '--negative-half-spine-width': '-6.5px'
    },

    '& .coordination': {
      '--starting-position': '460px',
      '--collapsed-position': '55.33px',
      '--negative-spine-width': '-20.166px',
      '--half-spine-width': '10.083px',
      '--negative-half-spine-width': '-10.083px'
    },

    '& .curiosity': {
      '--starting-position': '690px',
      '--collapsed-position': '81.66px',
      '--negative-spine-width': '-18.333px',
      '--half-spine-width': '9.166px',
      '--negative-half-spine-width': '-9.166px'
    },

    '& .alignment': {
      '--starting-position': '920px',
      '--collapsed-position': '110.82px',
      '--negative-spine-width': '-21.166px',
      '--half-spine-width': '10.583px',
      '--negative-half-spine-width': '-10.583px',
    },
  },
  revealedContent: {
    position: 'relative',
    opacity: 0,
    transition: 'opacity 0.5s ease',
    [theme.breakpoints.down('md')]: {
      opacity: 1
    }
  }
})

const BookAnimation = ({ classes, children, successContent }: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
  successContent?: any
}) => {
  const { query } = useLocation();
  const success = !!query.success
  return (
    <div className={classNames(classes.root, {[classes.success]: success})}>
      <div className="parent-container">
        <div className="book-container epistemology">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_spine_n8p1w4.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_cover_ecxmxo.jpg" />
          </div>
        </div>
        <div className="book-container agency">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_spine_d4jih0.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_cover_yqhnyo.jpg" />
          </div>
        </div>
        <div className="book-container coordination">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_coordination_spine_doxyww.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_coordination_cover_xbuj1e.jpg" />
          </div>
        </div>
        <div className="book-container curiosity">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_curiosity_spine_zdr1yv.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_curiosity_cover_yeatxr.jpg" />
          </div>
        </div>
        <div className="book-container alignment">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_Alignment_spine_bvrrmw.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_Alignment_cover_bberdl.jpg" />
          </div>
        </div>
        <div className={classes.revealedContent}>
          { success ? (successContent || children) : children}
        </div>
      </div>
    </div>
  )
}


const BookAnimationComponent = registerComponent('BookAnimation', BookAnimation, {
  styles,
  // This component tries to look like a printed book, which is white, so its colors
  // don't change in dark mode
  allowNonThemeColors: true,
});

declare global {
  interface ComponentTypes {
    BookAnimation: typeof BookAnimationComponent
  }
}
