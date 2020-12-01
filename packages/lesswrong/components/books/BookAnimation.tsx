import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import classNames from 'classnames';

const bodyFontSize = "16px"

const styles = (theme: ThemeType): JssStyles => ({
    root: {
        '& .parent-container': {
            'display': 'flex',
            'padding': '60px',
            'z-index': '2'
        },
        '& .book-container': {
            width: '200px',
            height: '300px',
            'margin-right': '30px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'perspective': '400px',
            'transition': 'margin-right 1.5s ease',
            'transform-style': 'preserve-3d',
        },
        '& .book': {
            transform: 'rotateY(0deg)',
            position: 'relative',
            'transform-style': 'preserve-3d',
            width: '200px',
            height: '300px',
            transition: 'transform 1.5s ease'
        },
        '& .parent-container:hover .book-container': {
            'margin-right': 'calc(-160px + var(--right-margin-adjustment))',
        },
        '& .parent-container:hover .book': {
            'transform': 'rotateY(90deg)',
        },
        '& .parent-container:hover .book::after': {
            'opacity': '0',
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
            'box-shadow': '-10px 0 50px 10px #666',
            'z-index': '-1',
            'transition': 'opacity 1s ease'
          },
        '& .epistemology': {
            '--right-margin-adjustment': '-18px',
            '--negative-spine-width': '-19.166px',
            '--half-spine-width': '8.5833px',
            '--negative-half-spine-width': '-8.5833px',
        },

        '& .agency': {
            '--right-margin-adjustment': '-8px',
            '--negative-spine-width': '-13px',
            '--half-spine-width': '6.5px',
            '--negative-half-spine-width': '-6.5px'
        },

        '& .coordination': {
            '--right-margin-adjustment': '-11px',
            '--negative-spine-width': '-20.166px',
            '--half-spine-width': '10.083px',
            '--negative-half-spine-width': '-10.083px'
        },

        '& .curiosity': {
            '--right-margin-adjustment': '-8px',
            '--negative-spine-width': '-18.333px',
            '--half-spine-width': '9.166px',
            '--negative-half-spine-width': '-9.166px'
        },

        '& .alignment': {
            '--right-margin-adjustment': '-8px',
            '--negative-spine-width': '-21.166px',
            '--half-spine-width': '10.583px',
            '--negative-half-spine-width': '-10.583px',
        },

        '& .outer-wrapper': {

        },

        '& .hidden-quote': {
            'opacity': '0%',
            'transition': 'opacity 1s',
            'position': 'absolute',
            'top': '20%',
            'left': '50%',
            'z-index': '1',
          },

          '& .parent-container:hover .hidden-quote': {
            'opacity': '100%'
          }
    },

})

const BookAnimation = ({ classes }: {
  classes: ClassesType,
}) => {

  return (
    <div className={classes.root}>

        <div className="parent-container">
            <div className="book-container epistemology">
                <div className="book">
                <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_spine_n8p1w4.png"/>
                <div className="spine-thickness"></div>
                <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_cover_ecxmxo.png"/>
                </div>
            </div>
            <div className="book-container agency">
                <div className="book">
                <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_spine_d4jih0.png"/>
                        <div className="spine-thickness"></div>
                <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_cover_yqhnyo.png"/>
                </div>
            </div>
            <div className="book-container coordination">
                <div className="book">
                <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_coordination_spine_doxyww.png"/>
                        <div className="spine-thickness"></div>
                <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_coordination_cover_xbuj1e.png"/>
                </div>
            </div>
            <div className="book-container curiosity">
                <div className="book">
                <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_curiosity_spine_zdr1yv.png"/>
                <div className="spine-thickness"></div>
                <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_curiosity_cover_yeatxr.png"/>
                </div>
            </div>
            <div className="book-container alignment">
                <div className="book">
                <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_Alignment_spine_bvrrmw.png"/>
                        <div className="spine-thickness"></div>
                <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_Alignment_cover_bberdl.png"/>
                </div>
            </div>
    </div>
    <p className="hidden-quote">
        The rationalists are great, man.
    </p>
</div>
  )
}


const BookAnimationComponent = registerComponent('BookAnimation', BookAnimation, { styles });

declare global {
  interface ComponentTypes {
    BookAnimation: typeof BookAnimationComponent
  }
}