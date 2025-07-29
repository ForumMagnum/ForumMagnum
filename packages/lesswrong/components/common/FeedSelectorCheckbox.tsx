import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useCurrentUser } from './withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE, ULTRA_FEED_PAGE_VISITED_COOKIE } from '../../lib/cookies/cookies';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { ultraFeedABTest } from '../../lib/abTests';
import { useABTest } from '../../lib/abTestImpl';
import { ultraFeedEnabledSetting } from '../../lib/publicSettings';
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import classNames from 'classnames';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';

const styles = defineStyles("FeedSelectorCheckbox", (theme: ThemeType) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
    marginRight: 16,
  },
  checkboxWrapper: {
    marginLeft: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // Override the SectionFooterCheckbox's mobile flex behavior to maintain inline layout
    '& .SectionFooterCheckbox-root': {
      flex: 'none',
    }
  },
  checkboxLabel: {
    whiteSpace: 'nowrap',
  },
}));

interface FeedSelectorCheckboxProps {
  currentFeedType: 'new' | 'classic';
}

const FeedSelectorCheckbox = ({ currentFeedType }: FeedSelectorCheckboxProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const abTestGroup = useABTest(ultraFeedABTest);
  const [cookies, setCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE, ULTRA_FEED_PAGE_VISITED_COOKIE]);
  
  const cookieValue = cookies[ULTRA_FEED_ENABLED_COOKIE];
  const hasVisitedFeedPage = cookies[ULTRA_FEED_PAGE_VISITED_COOKIE] === "true";
  const hasExplicitPreference = cookieValue === "true" || cookieValue === "false";
  
  // Don't show if (1) UltraFeed is disabled, (2) user is not logged in, or (3) user has not explicitly opted in, visited the feed page, or is in the A/B test group
  if (!ultraFeedEnabledSetting.get() || !currentUser || !(userIsAdmin(currentUser) || hasExplicitPreference || hasVisitedFeedPage || abTestGroup === 'ultraFeed')) {
    return null;
  }
  
  const checkboxChecked = currentFeedType === 'new';
  
  const handleToggle = async () => {
    const newValue = checkboxChecked ? 'classic' : 'new';
    setCookie(ULTRA_FEED_ENABLED_COOKIE, newValue === 'new' ? 'true' : 'false', { path: "/" });
    
    // Update A/B test override to match the user's choice
    const newTestGroup = newValue === 'new' ? 'ultraFeed' : 'control';
    await updateCurrentUser({
      abTestOverrides: {
        ...currentUser.abTestOverrides,
        [ultraFeedABTest.name]: newTestGroup,
      },
    });
  };

  return (
    <div className={classes.container}>
      <div className={classes.checkboxWrapper}>
        <SectionFooterCheckbox 
          value={checkboxChecked} 
          onClick={handleToggle} 
          label="Use New Feed"
          labelClassName={classes.checkboxLabel}
        />
      </div>
    </div>
  );
};

export default FeedSelectorCheckbox;
