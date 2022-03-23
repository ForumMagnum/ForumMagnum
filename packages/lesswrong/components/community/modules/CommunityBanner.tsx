import { registerComponent, } from '../../../lib/vulcan-lib';
import React from 'react';
import { createStyles } from '@material-ui/core/styles';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  bannerImg: {
    width: '100vw',
    height: 200,
    backgroundImage: `linear-gradient(to right, ${theme.palette.primary.dark} 30%, transparent), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_380,w_1600,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'top right',
    padding: 40,
    marginBottom: 10,
    [theme.breakpoints.down('sm')]: {
      backgroundImage: `linear-gradient(to right, rgba(8, 93, 108, 1) 300px, rgba(8, 93, 108, 0.4)), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_300,w_1000,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)`,
      marginLeft: -4,
      marginRight: -4,
    },
    [theme.breakpoints.down('xs')]: {
      height: 'auto',
      backgroundImage: `linear-gradient(to right, rgba(8, 93, 108, 1), rgba(8, 93, 108, 0.7)), url(https://res.cloudinary.com/cea/image/upload/c_fill,h_300,w_800,q_auto,f_auto/236225045_2995791057331456_5749161116892625450_n.jpg.jpg)`,
      padding: '30px 40px',
    }
  },
  bannerText: {
    maxWidth: 1200,
    color: 'white',
    margin: '0 auto'
  },
  bannerQuote: {
    position: 'relative',
    maxWidth: 500,
    fontSize: 20,
    lineHeight: '1.5em',
    fontStyle: 'italic',
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
}))

const CommunityBanner = ({classes}: {
  classes: ClassesType,
}) => {
  
  return <div className={classes.bannerImg}>
    <div className={classes.bannerText}>
      <div className={classes.bannerQuote}>
        In EA, I found a group of people who cared about the whole world, not just their small part of it,
        and who didn't need to agree on everything to be part of the same community.
      </div>
      <div className={classes.bannerQuoteAuthor}>- Vaidehi, member of EA East Bay</div>
    </div>
  </div>
}

const CommunityBannerComponent = registerComponent('CommunityBanner', CommunityBanner, {styles});

declare global {
  interface ComponentTypes {
    CommunityBanner: typeof CommunityBannerComponent
  }
}
