import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useCurrentUser } from './withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE, ULTRA_FEED_PAGE_VISITED_COOKIE } from '../../lib/cookies/cookies';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { ultraFeedABTest } from '../../lib/abTests';
import { ultraFeedEnabledSetting } from '../../lib/instanceSettings';
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";

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
  const [cookies, setCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE, ULTRA_FEED_PAGE_VISITED_COOKIE]);
  
  if (!ultraFeedEnabledSetting.get() || !currentUser) {
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
