import classNames from 'classnames';
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { postBodyStyles } from '../../themes/stylePiping';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_2021_BOOK_BANNER_COOKIE, HIDE_FEATURED_RESOURCE_COOKIE } from '../../lib/cookies/cookies';
import { Link } from '../../lib/reactRouterWrapper';

const collapsedStyles = (theme: ThemeType) => ({
  '& .book-container': {
    left: 'calc(var(--book-animation-left-offset, -100px) + var(--collapsed-position) - 90px)',
  },
  '& .book': {
    'transform': 'rotateY(90deg)',
  },
  '& .book::after': {
    'opacity': '0',
  },
  '&::after': {
    opacity: 1
  },
})

const styles = (theme: ThemeType) => ({
  buyButton: {
    display: 'flex',
    alignItems: 'center'
  },

  hide: {
    fontFamily: theme.typography.commentStyle.fontFamily,
    fontSize: 15,
    marginLeft: 16
  },

  amazonButton: {
    ...theme.typography.commentStyle,
    height: '36px',
    background: theme.palette.buttons.bookCheckoutButton,
    paddingLeft: 16,
    paddingRight: 16,
    color: `${theme.palette.buttons.primaryDarkText} !important`,
    fontSize: '14px',
    border: 0,
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.6',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    boxShadow: `0px 4px 5.5px 0px ${theme.palette.greyAlpha(0.07)}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    '&:hover': {
      opacity: 0.8
    },
  
  },
  success: {
    '& .parent-container': {
      ...collapsedStyles(theme)
    }
  },
  root: {
    [theme.breakpoints.down('md')]: {
      display: 'none'
    },
    position: 'relative',
    height: 350,
    transition: 'transform 1.5s ease',
    '&:before': {
      content: "' '",
      width: '100px',
      height: '0px',
      position: 'absolute',
      top: '50%',
      left: '15%',
      boxShadow: '0px -30px 100px 150px rgba(0,0,0,0.03)'
    },
    '&:has(.parent-container:hover)': {
      transform: 'translateX(0px)',
    },
    '--book-animation-left-offset': '0px',
    display: 'flex',
    '& .book2018': {
      width: 146
    },
    '& .book2018:hover': {
      width: 650  
    },
    '& .book2019': {
      width: 121
    },
    '& .book2019:hover': {
      width: 700  
    },
    '& .book2020': {
      width: 121
    },
    '& .book2020:hover': {
      width: 700  
    },
    '& .parent-container': {
      zIndex: '2',
      position: 'relative',
      height: 350,
      transition: 'width 1.5s ease'
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
      transition: 'transform 1.5s ease',
    },
    '& .book:hover': {
      opacity: 1
    },
    '& .parent-container:not(:hover)': {
      ...collapsedStyles(theme)
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
      'transition': 'opacity 1.5s ease'
    },
    '& .epistemology': {
      '--starting-position': '0px',
      '--collapsed-position': '8px',
      '--negative-spine-width': '-19.166px',
      '--half-spine-width': '8.5833px',
      '--negative-half-spine-width': '-8.5833px',
    },

    '& .agency': {
      '--starting-position': '100px',
      '--collapsed-position': '27.166px',
      '--negative-spine-width': '-13px',
      '--half-spine-width': '6.5px',
      '--negative-half-spine-width': '-6.5px'
    },

    '& .coordination': {
      '--starting-position': '200px',
      '--collapsed-position': '55.33px',
      '--negative-spine-width': '-20.166px',
      '--half-spine-width': '10.083px',
      '--negative-half-spine-width': '-10.083px'
    },

    '& .curiosity': {
      '--starting-position': '300px',
      '--collapsed-position': '81.66px',
      '--negative-spine-width': '-18.333px',
      '--half-spine-width': '9.166px',
      '--negative-half-spine-width': '-9.166px'
    },

    '& .alignment': {
      '--starting-position': '400px',
      '--collapsed-position': '110.82px',
      '--negative-spine-width': '-21.166px',
      '--half-spine-width': '10.583px',
      '--negative-half-spine-width': '-10.583px',
    },

    '& .trust': {
      '--starting-position': '0px',
      '--collapsed-position': '0px',
      '--negative-spine-width': '-25.70px',
      '--half-spine-width': '12.85px',
      '--negative-half-spine-width': '-12.85px'
    },

    '& .modularity': {
      '--starting-position': '150px',
      '--collapsed-position': '31px',
      '--negative-spine-width': '-24.56px',
      '--half-spine-width': '12.28px',
      '--negative-half-spine-width': '-12.28px'
    },

    '& .incentives': {
      '--starting-position': '300px',
      '--collapsed-position': '59px',
      '--negative-spine-width': '-22.02px',
      '--half-spine-width': '11.01px',
      '--negative-half-spine-width': '-11.01px'
    },

    '& .failure': {
      '--starting-position': '450px',
      '--collapsed-position': '89px',
      '--negative-spine-width': '-24.56px',
      '--half-spine-width': '12.28px',
      '--negative-half-spine-width': '-12.28px'
    },

    '& .coordination-constraint': {
      '--starting-position': '0px',
      '--collapsed-position': '0px',
      '--negative-spine-width': '-24.56px',
      '--half-spine-width': '12.28px',
      '--negative-half-spine-width': '-12.28px'
    },

    '& .alignment-agency': {
      '--starting-position': '150px',
      '--collapsed-position': '31.56px',
      '--negative-spine-width': '-24.56px',
      '--half-spine-width': '12.28px',
      '--negative-half-spine-width': '-12.28px'
    },

    '& .timelines-takeoff': {
      '--starting-position': '300px',
      '--collapsed-position': '62.56px',
      '--negative-spine-width': '-24.56px',
      '--half-spine-width': '12.28px',
      '--negative-half-spine-width': '-12.28px'
    },

    '& .reality-reason': {
      '--starting-position': '450px',
      '--collapsed-position': '93.56px',
      '--negative-spine-width': '-24.56px',
      '--half-spine-width': '12.28px',
      '--negative-half-spine-width': '-12.28px'
    },

    '&:has(.parent-container:hover) $revealedContent': {
      opacity: 0,
      transition: 'opacity 0.5s ease',
    },
  },
  revealedContent: {
    ...postBodyStyles(theme),
    position: 'absolute',
    right: 0,
    opacity: 1,
    transition: 'opacity 1.5s cubic-bezier(1, -0.11, 0.66, 0.99) 0.5s',
    maxWidth: '300px'
  }
})

const Books2021SaleAnimationInner = ({ classes, successContent }: {
  classes: ClassesType<typeof styles>,
  successContent?: any
}) => {
  const [cookies, setCookie] = useCookiesWithConsent([HIDE_2021_BOOK_BANNER_COOKIE])

  if (cookies[HIDE_2021_BOOK_BANNER_COOKIE]) {
    return null
  }
  
  return (
    <div className={classNames(classes.root)}>
      <div className="parent-container book2018">
        <div className="book-container epistemology">
          <a className="book" href="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_spine_n8p1w4.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606785787/v1.1_epistemology_cover_ecxmxo.jpg" />
          </a>
        </div>
        <div className="book-container agency">
          <a className="book" href="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_spine_d4jih0.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_agency_cover_yqhnyo.jpg" />
          </a>
        </div>
        <div className="book-container coordination">
          <a className="book" href="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_coordination_spine_doxyww.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_coordination_cover_xbuj1e.jpg" />
          </a>
        </div>
        <div className="book-container curiosity">
          <a className="book" href="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_curiosity_spine_zdr1yv.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792632/v1.1_curiosity_cover_yeatxr.jpg" />
          </a>
        </div>
        <div className="book-container alignment">
          <a className="book" href="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792629/v1.1_Alignment_spine_bvrrmw.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1606792630/v1.1_Alignment_cover_bberdl.jpg" />
          </a>
        </div>
      </div>
      <div className="parent-container book2019">
        <div className="book-container trust">
          <a className="book" href="https://www.amazon.com/Engines-Cognition-Essays-LessWrong-Community/dp/1736128515/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068924/TRUST-Cover_Spine_bsztnh.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068126/TRUST-Cover_smaller_agodox.jpg" />
          </a>
        </div>
        <div className="book-container modularity">
          <a className="book" href="https://www.amazon.com/Engines-Cognition-Essays-LessWrong-Community/dp/1736128515/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068912/MODULARITY-Cover_Spine_rdyh1n.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068218/MODULARITY_Front_smaller_js2iok.jpg" />
          </a>
        </div>
        <div className="book-container incentives">
          <a className="book" href="https://www.amazon.com/Engines-Cognition-Essays-LessWrong-Community/dp/1736128515/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068885/INCENTIVES-Cover_Spine_bljhdc.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068067/INCENTIVES_Front_smaller_v5bhqi.jpg" />
          </a>
        </div>
        <div className="book-container failure">
          <a className="book" href="https://www.amazon.com/Engines-Cognition-Essays-LessWrong-Community/dp/1736128515/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068843/FAILURE-Cover_Spine_l9kfls.jpg" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1640068350/FAILURE-Cover_Jacket_copy_zvmvvh.jpg" />
          </a>
        </div>
      </div>
      <div className="parent-container book2020">
        <div className="book-container coordination-constraint">
          <a className="book" href="https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1702342228/Spine_1_ypqobc.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320746/coordination-constraint_i8ievm.jpg" />
          </a>
        </div>
        <div className="book-container alignment-agency">
          <a className="book" href="https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1702342228/Spine_2_s4naer.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320745/alignment-agency-cover_ddrtzy.jpg" />
          </a>
        </div>
        <div className="book-container timelines-takeoff">
          <a className="book" href="https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1702342229/Spine_3_t0odgr.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320746/timelines-takeoff-cover_yxfvtw.jpg" />
          </a>
        </div>
        <div className="book-container reality-reason">
          <a className="book" href="https://www.amazon.com/Carving-Reality-Essays-LessWrong-Community/dp/B0C95MJJBK/">
            <img className="spine" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1702342229/Spine_4_tj8umw.png" />
            <div className="spine-thickness"></div>
            <img className="cover" src="https://res.cloudinary.com/lesswrong-2-0/image/upload/v1692320746/reality-reason_r9bpxq.jpg" />
          </a>
        </div>
      </div>
      <div className={classes.revealedContent}>
          <h2>LessWrong Books Holiday Sale</h2>
          <p>
            Until Christmas buy the "Best of LessWrong" books for 10% off, or buy all three for 20% off.
          </p>
          <p>
            134 essays in 13 books written by 64 authors. Curated by the LessWrong community. 
          </p>
          <div className={classes.buyButton}>
            <a className={classes.amazonButton} href="https://www.amazon.com/Map-that-Reflects-Territory-LessWrong/dp/1736128507/">
              Buy on Amazon
            </a>
            <a className={classes.hide} onClick={() => setCookie(HIDE_2021_BOOK_BANNER_COOKIE,"true")}> 
              Hide this banner
            </a>
          </div>
      </div>
    </div>
  )
}


export const Books2021SaleAnimation = registerComponent('Books2021SaleAnimation', Books2021SaleAnimationInner, {
  styles,
  // This component tries to look like a printed book, which is white, so its colors
  // don't change in dark mode
  allowNonThemeColors: true,
});


