import React, { ReactChildren } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import classNames from 'classnames';

const bodyFontSize = "16px"

const styles = (theme: ThemeType): JssStyles => ({
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
    [theme.breakpoints.up('md')]: {
      '& .parent-container:hover .book-container': {
        left: 'calc(var(--book-animation-left-offset, -100px) + var(--collapsed-position))',
      },
      '& .parent-container:hover .book': {
        'transform': 'rotateY(90deg)',
      },
      '& .parent-container:hover .book::after': {
        'opacity': '0',
      },
    },
    '& .parent-container:hover $revealedContent': {
      opacity: 1,
      transitionDelay: '1s',
      transition: 'opacity 1s ease'
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
    '& .parent-container:hover::after': {
      opacity: 1
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
        left: 'calc(var(--collapsed-position) - 65px)',
        top: 49
      },
      '& .parent-container': {
        paddingLeft: '200px',
        paddingTop: '40px',
        height: 'unset',
        maxWidth: 765,
        minHeight: 375
      }
    },
    [theme.breakpoints.down('xs')]: {
      '& .parent-container': {
        paddingLeft: 16,
        paddingTop: 395,  
        overflow: 'hidden'
      },
      '& .book-container': {
        left: 'calc(var(--collapsed-position) + 12vw)',
      },
      '& .parent-container::after': {
        left: '30vw',
      },
      
    },
    '& .book > .cover': {
      position: 'absolute',
      background: '#0d47a1aa',
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

const BookAnimation = ({ classes, children }: {
  classes: ClassesType,
  children: any
}) => {

  return (
    <div className={classes.root}>
      <div className="parent-container">
        <div className="book-container epistemology">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_spine_n8p1w4.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_cover_ecxmxo.png" />
          </div>
        </div>
        <div className="book-container agency">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_spine_d4jih0.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_cover_yqhnyo.png" />
          </div>
        </div>
        <div className="book-container coordination">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_coordination_spine_doxyww.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_coordination_cover_xbuj1e.png" />
          </div>
        </div>
        <div className="book-container curiosity">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_curiosity_spine_zdr1yv.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_curiosity_cover_yeatxr.png" />
          </div>
        </div>
        <div className="book-container alignment">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_Alignment_spine_bvrrmw.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_Alignment_cover_bberdl.png" />
          </div>
        </div>
        <div className={classes.revealedContent}>
          {children}
        </div>
      </div>
    </div>
  )
}


const BookAnimationComponent = registerComponent('BookAnimation', BookAnimation, { styles });

declare global {
  interface ComponentTypes {
    BookAnimation: typeof BookAnimationComponent
  }
}