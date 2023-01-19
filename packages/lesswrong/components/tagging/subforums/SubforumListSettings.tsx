import classNames from 'classnames';
import React from 'react';
import { useTracking } from '../../../lib/analyticsEvents';
import { SettingsOption } from '../../../lib/collections/posts/sortOrderOptions';
import { TAG_POSTS_SORT_ORDER_OPTIONS } from '../../../lib/collections/tags/schema';
import { isSubforumSorting, SubforumLayout } from '../../../lib/collections/tags/subforumHelpers';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: theme.spacing.unit,
    flexWrap: "wrap",
    background: theme.palette.panelBackground.default,
    padding: "12px 24px 8px 12px",
    
    '& .SettingsColumn-selectionList:last-child': {
      flex: '1 0',
    }
  },
  checkbox: {
    padding: "1px 12px 0 0"
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing.unit*2,
      flex: `1 0 100%`,
      order: 0
    }
  },
})

const sortings = Object.fromEntries(Object.entries(TAG_POSTS_SORT_ORDER_OPTIONS).filter(([key]) => isSubforumSorting(key)));
const layouts: Record<SubforumLayout, SettingsOption> = {
  feed: { label: "Posts expanded" },
  list: { label: "Posts collapsed" },
}

const SubforumListSettings = ({currentSorting, currentLayout, classes}: {
  currentSorting: any,
  currentLayout: any,
  classes: ClassesType,
}) => {
  const { SettingsColumn } = Components
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { captureEvent } = useTracking();

  const setSetting = (type, newSetting) => {
    if (type === 'sortedBy') {
      captureEvent("subforumSortingChanged", {oldSorting: currentSorting, newSorting: newSetting})
    } else if (type === 'layout') {
      captureEvent("subforumLayoutChanged", {oldLayout: currentLayout, newLayout: newSetting})
      if (currentUser) {
        // For logged in users, also update their layout preference
        void updateCurrentUser({subforumPreferredLayout: newSetting})
      }
    }
  }

  return (
      <div className={classes.root}>
        <SettingsColumn
          type={'sortedBy'}
          title={'Sorted by:'}
          options={sortings}
          currentOption={currentSorting}
          setSetting={setSetting}
          nofollow
        />

        <SettingsColumn
          type={'layout'}
          title={'Layout:'}
          options={layouts}
          currentOption={currentLayout}
          setSetting={setSetting}
          nofollow
        />
      </div>
  );
};

const SubforumListSettingsComponent = registerComponent(
  'SubforumListSettings', SubforumListSettings, { styles }
);

declare global {
  interface ComponentTypes {
    SubforumListSettings: typeof SubforumListSettingsComponent
  }
}
