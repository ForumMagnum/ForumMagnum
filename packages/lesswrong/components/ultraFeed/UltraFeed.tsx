import React, { useEffect } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from '../common/withUser';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE, ULTRA_FEED_PAGE_VISITED_COOKIE } from '../../lib/cookies/cookies';
import DeferRender from '../common/DeferRender';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import SectionFooterCheckbox from "../form-components/SectionFooterCheckbox";
import SingleColumnSection from "../common/SingleColumnSection";
import dynamic from 'next/dynamic';

const styles = defineStyles("UltraFeed", (theme: ThemeType) => ({
  checkboxLabel: {
    whiteSpace: 'nowrap',
    justifyContent: 'center',
  },
  checkboxLabelAlwaysShow: {
    fontSize: '1.8rem',
    justifyContent: 'center',
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
    marginBottom: 8,
    marginRight: 8,
  },
}));


const UltraFeed = ({alwaysShow = false, onShowingChange}: {
  alwaysShow?: boolean
  onShowingChange?: (isShowing: boolean) => void
}) => {
  const UltraFeedContent = dynamic(() => import('./UltraFeedContent'), { ssr: false });
  
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [ultraFeedCookie, setUltraFeedCookie] = useCookiesWithConsent([ULTRA_FEED_ENABLED_COOKIE]);
  const [ultraFeedPageVisitedCookie] = useCookiesWithConsent([ULTRA_FEED_PAGE_VISITED_COOKIE]);

  
  const hasVisitedFeedPage = ultraFeedPageVisitedCookie[ULTRA_FEED_PAGE_VISITED_COOKIE] === "true";
  const checkboxChecked = ultraFeedCookie[ULTRA_FEED_ENABLED_COOKIE] === "true";

  const showFeed = (alwaysShow || checkboxChecked || userIsAdminOrMod(currentUser)) && !!currentUser;
  const showCheckbox = (checkboxChecked || hasVisitedFeedPage || alwaysShow) && !!currentUser && !userIsAdminOrMod(currentUser);

  useEffect(() => {
    onShowingChange?.(showFeed);
  }, [showFeed, onShowingChange]);

  if (!currentUser) {
    return null;
  }

  const toggleUltraFeed = () => {
    setUltraFeedCookie(ULTRA_FEED_ENABLED_COOKIE, String(!checkboxChecked), { path: "/" });
  };

  const checkBoxLabel = alwaysShow ? "Use New Feed on the frontpage (in place of Recent Discussion)" : "Use New Feed";
  const labelClassName = alwaysShow ? classes.checkboxLabelAlwaysShow : classes.checkboxLabel;

  return (
    <>
      {showCheckbox && <SingleColumnSection>
          <div className={classes.toggleContainer}>
            <SectionFooterCheckbox 
            value={checkboxChecked} 
            onClick={toggleUltraFeed} 
            label={checkBoxLabel}
            labelClassName={labelClassName}
          />
        </div>
      </SingleColumnSection>}
      {showFeed && (
        <DeferRender ssr={false}>
          <UltraFeedContent alwaysShow={alwaysShow} />
        </DeferRender>
      )}
    </>
  );
};

export default registerComponent('UltraFeed', UltraFeed);

 
