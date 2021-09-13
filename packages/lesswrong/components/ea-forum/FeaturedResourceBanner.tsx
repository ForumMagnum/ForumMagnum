import React from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Button, Card, createStyles, Divider, Typography } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { useMulti } from '../../lib/crud/withMulti';

const styles = createStyles((theme: ThemeType): JssStyles => ({
  card: {
    margin: '1em 0 1em 1em',
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
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: '1.05rem',
  },
  ctaButton: {
    borderRadius: 'unset',
    minWidth: '50%',
    background: theme.palette.primary.main,
    color: 'white'
  }
}));

const bodyWithInterpolatedDate = (resource: FeaturedResourcesFragment): string => {
  return resource.body.replace(/\[\s*DATE\s*\]/, resource.expiresAt.toString());
}

const FeaturedResourceBanner = ({terms, classes} : {
  terms: FeaturedResourcesViewTerms,
  classes: ClassesType
}) => {
  const { results, loading } = useMulti({
    terms,
    collectionName: 'FeaturedResources',
    fragmentName: 'FeaturedResourcesFragment',
    enableTotal: false,
  });
  if(loading || !results.length) {
    return null;
  }
  const resource = results[0];
  return <Card className={classes.card}>
    <Button className={classes.closeButton}>
        <CloseIcon className={classes.closeIcon}/>
    </Button>    
    <Typography variant="title" className={classes.title}>
      {resource.title}
    </Typography>
    <Divider className={classes.divider}/>
    <Typography variant="body2" className={classes.body}>
      {bodyWithInterpolatedDate(resource)}
    </Typography>
    <a href={resource.ctaUrl}>
      <Button color="primary" className={classes.ctaButton}>
        {resource.ctaText}
      </Button>
    </a>
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
