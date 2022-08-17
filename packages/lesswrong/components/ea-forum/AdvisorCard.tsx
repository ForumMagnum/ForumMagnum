import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';


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
  },
  roleAndOrg: {
    fontSize: 12,
    marginTop: 4
  },
})

const AdvisorCard = ({user, classes}: {
  user: {
    profileImageId: string,
    name: string,
    jobTitle: string,
    organization: string
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
