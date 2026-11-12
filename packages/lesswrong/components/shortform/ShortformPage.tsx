"use client";

import React, { useState } from 'react';
import noop from 'lodash/noop';
import SingleColumnSection from "../common/SingleColumnSection";
import ShortformThreadList from "./ShortformThreadList";
import SectionTitle from "../common/SectionTitle";
import SettingsColumn from "../common/SettingsColumn";
import SettingsButton from "../icons/SettingsButton";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { useLocation } from '@/lib/routeUtil';
import { objectKeys } from '@/lib/utils/typeGuardUtils';
import type { SettingsOption } from '@/lib/collections/posts/dropdownOptions';

const sortOptions = {
  magic: { label: 'Magic (New & Upvoted)' },
  top: { label: 'Top' },
  recentComments: { label: 'Recent Comments' },
  new: { label: 'New' },
  old: { label: 'Old' },
} satisfies Partial<Record<CommentSortingMode, SettingsOption>>;

const styles = defineStyles('ShortformPage', (theme: ThemeType) => ({
  column: {
    maxWidth:680,
    margin:"auto"
  },
  settingsButton: {
    background: 'none',
    border: 'none',
    padding: 0,
  },
  settings: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    padding: '12px 24px 8px 12px',
    marginBottom: 16,
  },
}))

const ShortformPage = () => {
  const classes = useStyles(styles);
  const { query } = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const currentSorting = objectKeys(sortOptions).find(sort => sort === query.sortBy) ?? 'recentComments';

  return (
    <SingleColumnSection>
      <div className={classes.column}>
        <SectionTitle title={"Quick Takes"}>
          <button
            type="button"
            className={classes.settingsButton}
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Quick Takes sort settings"
            aria-expanded={showSettings}
            aria-controls="quick-takes-settings"
          >
            <SettingsButton label={`Sorted by ${sortOptions[currentSorting].label}`} />
          </button>
        </SectionTitle>
        {showSettings && <div id="quick-takes-settings" className={classes.settings}>
          <SettingsColumn
            type="sortBy"
            title="Sorted by:"
            options={sortOptions}
            currentOption={currentSorting}
            setSetting={noop}
            nofollow
          />
        </div>}
        <ShortformThreadList sortBy={currentSorting} />
      </div>
    </SingleColumnSection>
  )
}

export default ShortformPage;


