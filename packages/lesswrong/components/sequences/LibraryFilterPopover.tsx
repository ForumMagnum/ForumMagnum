import React, { useState } from 'react';
import classNames from 'classnames';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { LIBRARY_CORE_TAG_NAMES } from '@/lib/collections/sequences/libraryTopics';
import { LIBRARY_BASE_SORT_OPTIONS, LIBRARY_RANKING_SORT_OPTIONS } from '@/lib/collections/sequences/librarySortOptions';
import LWPopper from '../common/LWPopper';
import LWClickAwayListener from '../common/LWClickAwayListener';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LibraryTopicCountsQuery = gql(`
  query LibraryTopicCounts {
    libraryTopicCounts {
      topic
      count
    }
  }
`);

export interface LibraryFilterSettings {
  topics: string[];
  curatedOnly: boolean;
  sortBy: string;
}

export const defaultLibraryFilterSettings: LibraryFilterSettings = {
  topics: [],
  curatedOnly: false,
  sortBy: 'recommended',
};

const styles = defineStyles('LibraryFilterPopover', (theme: ThemeType) => ({
  popover: {
    width: 450,
    marginTop: 4,
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.faint,
    borderRadius: 3,
    boxShadow: `0 0 20px ${theme.palette.boxShadowColor(0.2)}`,
    fontFamily: theme.typography.fontFamily,
  },
  columns: {
    display: 'flex',
  },
  sortColumn: {
    width: 180,
    flex: 'none',
    borderRight: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    padding: '8px 0',
  },
  tagsColumn: {
    flex: 1,
    minWidth: 0,
    maxHeight: 250,
    overflowY: 'auto',
    padding: '8px 0',
  },
  columnHeader: {
    padding: '6px 14px',
    fontSize: 11,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '.6px',
    color: theme.palette.grey[600],
  },
  sortOption: {
    padding: '6px 14px',
    fontSize: 13.5,
    color: theme.palette.text.normal,
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.background.hover,
    },
  },
  sortOptionSelected: {
    background: theme.palette.background.hover,
    fontWeight: 500,
  },
  tagRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 14px',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.background.hover,
    },
  },
  checkbox: {
    width: 14,
    height: 14,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 3,
  },
  checkboxChecked: {
    background: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  },
  checkIcon: {
    fontSize: 12,
    color: theme.palette.text.alwaysWhite,
  },
  tagName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13.5,
    color: theme.palette.text.normal,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tagCount: {
    fontSize: 12,
    color: theme.palette.text.dim,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderTop: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    padding: '9px 14px',
  },
  curatedOnly: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 13,
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    flex: 1,
  },
  clear: {
    fontSize: 13,
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  applyButton: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    fontWeight: 500,
    padding: '5px 14px',
    border: 'none',
    borderRadius: 3,
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
}));

/**
 * The /library "All tags" popover (design artboard 9b): sort selector + topic
 * checklist + curated-only, staged locally and committed on Apply. Closing
 * without Apply (outside click) discards staged changes; Clear resets the
 * staged state to the defaults but still requires Apply.
 */
const LibraryFilterPopover = ({anchorEl, settings, onApply, onClose}: {
  anchorEl: HTMLElement | null,
  settings: LibraryFilterSettings,
  onApply: (settings: LibraryFilterSettings) => void,
  onClose: () => void,
}) => {
  const classes = useStyles(styles);
  const [staged, setStaged] = useState(settings);

  // Static per-topic totals (not narrowed by the other active filters)
  const { data } = useQuery(LibraryTopicCountsQuery);
  const topicCounts = data?.libraryTopicCounts;

  const toggleTopic = (topic: string) => {
    setStaged(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic],
    }));
  };

  const getTopicCount = (topic: string) =>
    topicCounts?.find(entry => entry.topic === topic)?.count;

  return <LWPopper open={true} anchorEl={anchorEl} placement="bottom-end">
    <LWClickAwayListener onClickAway={onClose}>
      <div className={classes.popover}>
        <div className={classes.columns}>
          <div className={classes.sortColumn}>
            <div className={classes.columnHeader}>Sort by</div>
            {LIBRARY_BASE_SORT_OPTIONS.map(({value, label}) => <div
              key={value}
              className={classNames(classes.sortOption, staged.sortBy === value && classes.sortOptionSelected)}
              onClick={() => setStaged(prev => ({...prev, sortBy: value}))}
            >
              {label}
            </div>)}
            <div className={classes.columnHeader}>Bake-off</div>
            {LIBRARY_RANKING_SORT_OPTIONS.map(({value, label}) => <div
              key={value}
              className={classNames(classes.sortOption, staged.sortBy === value && classes.sortOptionSelected)}
              onClick={() => setStaged(prev => ({...prev, sortBy: value}))}
            >
              {label}
            </div>)}
          </div>
          <div className={classes.tagsColumn}>
            <div className={classes.columnHeader}>Tags</div>
            {LIBRARY_CORE_TAG_NAMES.map(topic => {
              const checked = staged.topics.includes(topic);
              const count = getTopicCount(topic);
              return <div key={topic} className={classes.tagRow} onClick={() => toggleTopic(topic)}>
                <span
                  className={classNames(classes.checkbox, checked && classes.checkboxChecked)}
                  role="checkbox"
                  aria-checked={checked}
                  aria-label={topic}
                >
                  {checked && <CheckIcon className={classes.checkIcon} />}
                </span>
                <span className={classes.tagName}>{topic}</span>
                {count !== undefined && <span className={classes.tagCount}>{count}</span>}
              </div>;
            })}
          </div>
        </div>
        <div className={classes.footer}>
          <span
            className={classes.curatedOnly}
            onClick={() => setStaged(prev => ({...prev, curatedOnly: !prev.curatedOnly}))}
          >
            <span
              className={classNames(classes.checkbox, staged.curatedOnly && classes.checkboxChecked)}
              role="checkbox"
              aria-checked={staged.curatedOnly}
              aria-label="Curated only"
            >
              {staged.curatedOnly && <CheckIcon className={classes.checkIcon} />}
            </span>
            <span>Curated only</span>
          </span>
          <span className={classes.clear} onClick={() => setStaged(defaultLibraryFilterSettings)}>
            Clear
          </span>
          <button className={classes.applyButton} onClick={() => onApply(staged)}>
            Apply
          </button>
        </div>
      </div>
    </LWClickAwayListener>
  </LWPopper>;
};

export default LibraryFilterPopover;
