"use client";

import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { Link } from '../../lib/reactRouterWrapper';
import Error404 from "../common/Error404";
import SingleColumnSection from "../common/SingleColumnSection";
import { useCurrentUser } from '../common/withUser';
import BasicOnboardingFlow from "../onboarding/BasicOnboardingFlow";

const styles = defineStyles("AdminViewOnboarding", (theme: ThemeType) => ({
  link: {
    fontSize: 16,
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginTop: 20,
  },
}));

/**
 * This page lets admins on the EA Forum view the onboarding flow,
 * so that we don't have to keep making new users to test it.
 */
const AdminViewOnboarding = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  if (!currentUser?.isAdmin) {
    return <Error404 />
  }

  return <SingleColumnSection>
    <Link to="/admin" className={classes.link}>Back to Admin Home</Link>
    {<BasicOnboardingFlow viewAsAdmin />}
  </SingleColumnSection>
}

export default AdminViewOnboarding;


