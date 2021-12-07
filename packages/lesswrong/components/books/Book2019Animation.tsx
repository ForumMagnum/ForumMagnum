import classNames from 'classnames';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { registerComponent } from '../../lib/vulcan-lib';

const collapsedStyles = theme => ({
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

const styles = (theme: ThemeType): JssStyles => ({
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
      height: '330px',
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
      width: '220px',
      height: '330px',
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
      width: '220px',
      height: '330px',
      'border-top-right-radius': '3px',
      'border-bottom-right-radius': '3px'
    },
    '& .book > .spine': {
      background: 'transparent',
      height: '330px',
      width: 'calc(var(--half-spine-width, 14px)*2)',
      position: 'absolute',
      left: 'var(--negative-half-spine-width, -14px)',
      transform: 'rotateY(-90deg) translateX(var(--negative-half-spine-width, -14px))'
    },
    '& .book > .spine-thickness': {
      position: 'absolute',
      height: '330px',
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
      width: '220px',
      height: '330px',
      'border-top-right-radius': '3px',
      'border-bottom-right-radius': '3px',
      'background': 'white',
      'transform': 'translateZ(var(--negative-spine-width, -26px))',
      'box-shadow': '5px 0 40px 9px #EEE',
      'z-index': '-1',
      'transition': 'opacity 1s ease'
    },
    '& .trust': {
      '--starting-position': '0px',
      '--collapsed-position': '0px',
      '--negative-spine-width': '-20px',
      '--half-spine-width': '10.083px',
      '--negative-half-spine-width': '-10.083px'
    },

    '& .modularity': {
      '--starting-position': '245px',
      '--collapsed-position': '30px',
      '--negative-spine-width': '-20px',
      '--half-spine-width': '10.083px',
      '--negative-half-spine-width': '-10.083px'
    },

    '& .incentives': {
      '--starting-position': '490px',
      '--collapsed-position': '60px',
      '--negative-spine-width': '-20px',
      '--half-spine-width': '10.083px',
      '--negative-half-spine-width': '-10.083px'
    },

    '& .failure': {
      '--starting-position': '735px',
      '--collapsed-position': '90px',
      '--negative-spine-width': '-20px',
      '--half-spine-width': '10.083px',
      '--negative-half-spine-width': '-10.083px'
    }
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

const Book2019Animation = ({ classes, children, successContent }: {
  classes: ClassesType,
  children: any,
  successContent?: any
}) => {
  const { query } = useLocation();
  const success = !!query.success
  return (
    <div className={classNames(classes.root, {[classes.success]: success})}>
      <div className="parent-container">
        <div className="book-container trust">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637180870/Trust_Spine_vqo46u.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102661/trust-book-2_nslyeu.jpg" />
          </div>
        </div>
        <div className="book-container modularity">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637180870/Modularity_Spine_fnilmm.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102661/modularity-book-2_lotdh9.jpg" />
          </div>
        </div>
        <div className="book-container incentives">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637180870/Incentives_Spine_f3g3ws.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102660/incentives-book-2_qizmns.jpg" />
          </div>
        </div>
        <div className="book-container failure">
          <div className="book">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637180870/Failure_Spine_sevgoi.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1637102660/failure-book-2_qr4jvd.jpg" />
          </div>
        </div>
        <div className={classes.revealedContent}>
          { success ? (successContent || children) : children}
        </div>
      </div>
    </div>
  )
}


const Book2019AnimationComponent = registerComponent('Book2019Animation', Book2019Animation, { styles });

declare global {
  interface ComponentTypes {
    Book2019Animation: typeof Book2019AnimationComponent
  }
}
