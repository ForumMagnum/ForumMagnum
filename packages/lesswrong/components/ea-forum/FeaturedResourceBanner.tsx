import React from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Button, Card, createStyles, Divider, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  card: {
    margin: '1em',
    padding: '2em',
    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.07)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  closeButton: {
    padding: '.25em',
    margin: "-1.5em -1.5em 0 0",
    minHeight: '.75em',
    minWidth: '.75em',
    alignSelf: 'end',
  },
  closeIcon: {
    width: '.6em',
    height: '.6em',
    color: 'rgba(0, 0, 0, .2)',
  },
  title: {
    color: '#616161',
    paddingBottom: '1em',
    fontFamily: theme.typography.fontFamily,
  },
  divider: {
    width: '50%',
  },
  body: {
    color: '#616161',
    marginTop: '1em',
    marginBottom: '1em',
    fontFamily: theme.typography.fontFamily,
  },
  ctaButton: {
    borderRadius: 'unset',
    minWidth: '50%',
    background: theme.palette.primary.main,
    color: 'white'
  }
}));

const FeaturedResourceBanner = ({classes}) => {
  return <Card className={classes.card}>
    <Button className={classes.closeButton}>
        <CloseIcon className={classes.closeIcon}/>
    </Button>    
    <Typography variant="title" className={classes.title}>
      Virtual Programs
    </Typography>
    <Divider className={classes.divider}/>
    <Typography variant="body2" className={classes.body}>
      Engage intensively with the ideas of effective altruism through 8-week programs of readings, videos, podcasts, exercises, and weekly small-group discussions.
 Applications close on [DATE].
    </Typography>
    <Button color="primary" className={classes.ctaButton}>
      Apply now
    </Button>
  </Card>
}

const FeaturedResourceBannerComponent = registerComponent(
  'FeaturedResourceBanner', FeaturedResourceBanner, {styles}
)

declare global {
  interface ComponentTypes {
    FeaturedResourceBanner: typeof FeaturedResourceBannerComponent
  }
}
