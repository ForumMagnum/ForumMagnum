import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';

const styles = (theme: ThemeType) => ({
  bannerImg: {
    width: '100vw',
    height: 220,
    backgroundImage: `linear-gradient(to right, ${theme.palette.primary.dark} 20%, transparent), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_380,w_1600,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'top right',
    padding: 50,
    marginBottom: 10,
    marginTop: -theme.spacing.mainLayoutPaddingTop, // compensate for the padding added in Layout.tsx
    [theme.breakpoints.down('sm')]: {
      backgroundImage: `linear-gradient(to right, rgba(8, 93, 108, 1) 200px, rgba(8, 93, 108, 0.4)), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_300,w_1000,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)`,
      marginTop: 0,
      marginLeft: -8,
      marginRight: -8,
    },
    [theme.breakpoints.down('xs')]: {
      height: 'auto',
      backgroundImage: `linear-gradient(to right, rgba(8, 93, 108, 1), rgba(8, 93, 108, 0.7)), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_300,w_800,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)`,
      padding: '30px 40px',
    }
  },
  bannerText: {
    maxWidth: 1200,
    color: theme.palette.text.alwaysWhite,
    margin: '0 auto'
  },
  bannerQuote: {
    position: 'relative',
    maxWidth: 300,
    fontSize: 20,
    fontStyle: 'italic',
    lineHeight: '1.5em',
    '&:before': {
      content: '"\\201C"',
      position: 'absolute',
      top: 32,
      left: -60,
      fontSize: 200,
      opacity: 0.2
    },
    [theme.breakpoints.down('xs')]: {
      maxWidth: '100%',
      fontSize: 18
    }
  },
  bannerQuoteAuthor: {
    ...theme.typography.commentStyle,
    maxWidth: 500,
    fontSize: 13,
    opacity: 0.7,
    marginTop: 10
  },
});

const CommunityBanner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  // quote is from this post, with permission from the author:
  // https://forum.effectivealtruism.org/posts/kE3FRC5gq9QxMrn3w/what-drew-me-to-ea-reflections-on-ea-as-relief-growth-and
  return <div className={classes.bannerImg}>
    <div className={classes.bannerText}>
      <div className={classes.bannerQuote}>
        In EA, I found a group of people who cared about the whole world, not just their small part of it...
      </div>
      <div className={classes.bannerQuoteAuthor}>- Vaidehi, member of EA East Bay</div>
    </div>
  </div>
}

const CommunityBannerComponent = registerComponent('CommunityBanner', CommunityBanner, {
  styles,
  
  // This is based around an image, so it doesn't get inverted in dark mdoe
  allowNonThemeColors: true,
});

declare global {
  interface ComponentTypes {
    CommunityBanner: typeof CommunityBannerComponent
  }
}

export default CommunityBannerComponent;
