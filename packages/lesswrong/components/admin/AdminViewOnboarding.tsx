"use client";

import React from 'react';
import { useCurrentUser } from '../common/withUser';
import { isEAForum } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import SingleColumnSection from "../common/SingleColumnSection";
import EAOnboardingFlow from "../ea-forum/onboarding/EAOnboardingFlow";
import BasicOnboardingFlow from "../onboarding/BasicOnboardingFlow";
import Error404 from "../common/Error404";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

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
    {isEAForum() ? <EAOnboardingFlow viewAsAdmin /> : <BasicOnboardingFlow viewAsAdmin />}
  </SingleColumnSection>
}

export default AdminViewOnboarding;


