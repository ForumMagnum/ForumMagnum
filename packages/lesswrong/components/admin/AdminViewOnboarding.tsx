import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { isEAForum } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  link: {
    fontSize: 16,
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginTop: 20,
  },
});

/**
 * This page lets admins on the EA Forum view the onboarding flow,
 * so that we don't have to keep making new users to test it.
 */
const AdminViewOnboarding = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  
  const { 
    SingleColumnSection, 
    EAOnboardingFlow,
    BasicOnboardingFlow,
    Error404 ,
  } = Components;
  
  if (!currentUser?.isAdmin) {
    return <Error404 />
  }

  return <SingleColumnSection>
    <Link to="/admin" className={classes.link}>Back to Admin Home</Link>
    {isEAForum ? <EAOnboardingFlow viewAsAdmin /> : <BasicOnboardingFlow viewAsAdmin />}
  </SingleColumnSection>
}

const AdminViewOnboardingComponent = registerComponent(
  "AdminViewOnboarding", AdminViewOnboarding, {styles}
);

declare global {
  interface ComponentTypes {
    AdminViewOnboarding: typeof AdminViewOnboardingComponent
  }
}
