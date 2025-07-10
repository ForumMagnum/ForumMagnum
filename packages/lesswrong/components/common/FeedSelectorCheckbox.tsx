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
  message: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
    lineHeight: 1.25,
    fontSize: 13,
    fontStyle: 'italic',
    textWrap: 'balance',
    [theme.breakpoints.down('sm')]: {
      textAlign: 'right',
      marginRight: 8,
    },
  },
  checkboxWrapper: {
    marginLeft: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // gap: 2,
    // Override the SectionFooterCheckbox's mobile flex behavior
    '& .SectionFooterCheckbox-root': {
      [theme.breakpoints.down('xs')]: {
        flex: 'none',
      }
    }
  },
  checkboxLabel: {
    whiteSpace: 'nowrap',
  },
  feedbackButton: {
    marginLeft: 12,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    fontSize: 12,
    fontStyle: 'italic',
    padding: '4px 6px',
    borderRadius: 4,
    fontFamily: theme.palette.fonts.sansSerifStack,
    '&:hover': {
      color: theme.palette.ultraFeed.dim,
      backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  feedbackButtonActive: {
    color: theme.palette.ultraFeed.dim,
    backgroundColor: theme.palette.panelBackground.hoverHighlightGrey,
  },
}));

interface FeedSelectorCheckboxProps {
  currentFeedType: 'new' | 'classic';
  showFeedback?: boolean;
  onFeedbackClick?: () => void;
}

const FeedSelectorCheckbox = ({ currentFeedType, showFeedback, onFeedbackClick }: FeedSelectorCheckboxProps) => {
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
  
  const message = (abTestGroup === 'ultraFeed' && !hasExplicitPreference)
    ? "You've been placed in the test group of the New Feed a/b test →"
    : undefined;
  
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
      {message && <span className={classes.message}>{message}</span>}
      <div className={classes.checkboxWrapper}>
        <SectionFooterCheckbox 
          value={checkboxChecked} 
          onClick={handleToggle} 
          label="Use New Feed"
          labelClassName={classes.checkboxLabel}
        />
        {onFeedbackClick && (
          <span className={classNames(classes.feedbackButton, showFeedback && classes.feedbackButtonActive)} onClick={onFeedbackClick}>
            give feedback
          </span>
        )}
      </div>
    </div>
  );
};

export default FeedSelectorCheckbox;
