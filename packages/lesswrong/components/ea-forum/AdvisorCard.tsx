import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import LocationIcon from '@material-ui/icons/LocationOn'
import { socialMediaIconPaths } from '../form-components/PrefixedInput';


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 16
  },
  profileImage: {
    'box-shadow': `3px 3px 1px ${theme.palette.boxShadowColor(.25)}`,
    '-webkit-box-shadow': `0px 0px 2px 0px ${theme.palette.boxShadowColor(.25)}`,
    '-moz-box-shadow': `3px 3px 1px ${theme.palette.boxShadowColor(.25)}`,
    borderRadius: '50%',
    marginBottom: 14,
  },
  name: {
    fontSize: 16,
    fontWeight: 700
  },
  roleAndOrg: {
    fontSize: 12,
    marginTop: 4
  },
  // careerStage: {
  //   color: theme.palette.grey[600],
  //   fontSize: 11,
  //   marginTop: 4
  // },
  locationRow: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: 20,
    color: theme.palette.grey[700],
    fontSize: 12,
    marginTop: 6
  },
  location: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 3,
  },
  locationIcon: {
    fontSize: 14,
  },
  socialMediaIcons: {
    display: 'flex',
    columnGap: 6,
  },
  socialMediaIcon: {
    flex: 'none',
    height: 16,
    fill: theme.palette.grey[600],
  },
  askMeAbout: {
    color: theme.palette.grey[500],
    fontSize: 10,
    marginTop: 16
  },
  topics: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[700],
    fontSize: 12,
    lineHeight: '19px',
    paddingInlineStart: '16px',
    margin: 0
  }
})

const AdvisorCard = ({user, classes}: {
  user: {
    profileImageId: string,
    name: string,
    jobTitle: string,
    organization: string,
    location: string,
    linkedinProfileSlug: string,
    twitterProfileSlug: string,
    askMeAbout: Array<string>,
  },
  classes: ClassesType,
}) => {
  const { CloudinaryImage2, ContentStyles, Typography } = Components

  return <div className={classes.root}>
    {user.profileImageId && <CloudinaryImage2
      height={96}
      width={96}
      imgProps={{q: '100'}}
      publicId={user.profileImageId}
      className={classes.profileImage}
    />}
    <Typography variant="headline" className={classes.name}>{user.name}</Typography>
    <ContentStyles contentType="comment" className={classes.roleAndOrg}>
      {user.jobTitle} @ {user.organization}
    </ContentStyles>
    <ContentStyles contentType="comment" className={classes.locationRow}>
      <div className={classes.location}>
        <LocationIcon className={classes.locationIcon} />
        {user.location}
      </div>
      <div className={classes.socialMediaIcons}>
        <a href={`https://linkedin.com/in/${user.linkedinProfileSlug}`} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" className={classes.socialMediaIcon}>{socialMediaIconPaths.linkedinProfileURL}</svg>
        </a>
        <a href={`https://twitter.com/${user.twitterProfileSlug}`} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" className={classes.socialMediaIcon}>{socialMediaIconPaths.twitterProfileURL}</svg>
        </a>
      </div>
    </ContentStyles>
    
    <ContentStyles contentType="comment" className={classes.askMeAbout}>
      ASK ME ABOUT
    </ContentStyles>
    <ul className={classes.topics}>
      {user.askMeAbout.map(topic => {
        return <li key={topic}>{topic}</li>
      })}
    </ul>
  </div>
}

const AdvisorCardComponent = registerComponent(
  'AdvisorCard', AdvisorCard, {styles}
);

declare global {
  interface ComponentTypes {
    AdvisorCard: typeof AdvisorCardComponent
  }
}
