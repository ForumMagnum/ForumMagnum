import React from 'react';
import classNames from 'classnames';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { LIBRARY_CORE_TAG_NAMES } from '@/lib/collections/sequences/libraryTopics';
import { LibraryFilterSettings, LibraryStatusFilter } from './LibraryFilterPopover';
import { useCurrentUser } from '../common/withUser';
import AddTagButton from '../tagging/AddTagButton';
import SequencesNewButton from './SequencesNewButton';
import LWTooltip from '../common/LWTooltip';
import CloseIcon from '@/lib/vendor/@material-ui/icons/src/Close';
import CheckIcon from '@/lib/vendor/@material-ui/icons/src/Check';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LibraryTopicCountsSidebarQuery = gql(`
  query LibraryTopicCountsSidebar {
    libraryTopicCounts {
      topic
      count
    }
  }
`);

const LibraryStatusCountsQuery = gql(`
  query LibraryStatusCounts {
    libraryStatusCounts {
      unread
      inProgress
      finished
    }
  }
`);

// Lightweight total for the "All topics" facet count; the list's own query
// loses its total while the search resolver path is active.
const LibrarySequencesTotalCountQuery = gql(`
  query LibrarySequencesTotalCount {
    sequences(selector: { librarySequences: {} }, limit: 1, enableTotal: true) {
      totalCount
    }
  }
`);

const STATUS_FILTERS: { value: LibraryStatusFilter, label: string }[] = [
  { value: 'unread', label: 'Unread' },
  { value: 'inProgress', label: 'In progress' },
  { value: 'finished', label: 'Finished' },
];

const styles = defineStyles('LibraryFilterSidebar', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '.6px',
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    marginBottom: 8,
  },
  facetList: {
    display: 'flex',
    flexDirection: 'column',
  },
  facetRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px',
    padding: '5px 8px',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.background.hover,
    },
  },
  facetRowActive: {
    background: theme.palette.background.hover,
    '& $facetName': {
      fontWeight: 500,
    },
  },
  facetName: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.text.normal,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  facetCount: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
  },
  // The "+" wikitag picker, styled as a quiet extra facet row.
  addFilterRow: {
    display: 'inline-block',
    padding: '5px 8px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  checkboxRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '0 4px',
    '&:hover': {
      opacity: .85,
    },
  },
  checkbox: {
    width: 15,
    height: 15,
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
  },
  checkboxChecked: {
    background: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
  },
  checkIcon: {
    fontSize: 12,
    color: theme.palette.text.alwaysWhite,
  },
  checkboxLabel: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.text.normal,
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '5px',
  },
  chip: {
    background: theme.palette.grey[200],
    borderRadius: 3,
    padding: '4px 10px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.normal,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '&:hover': {
      background: theme.palette.grey[300],
    },
  },
  chipSelected: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      background: theme.palette.primary.dark,
    },
  },
  chipCount: {
    opacity: .6,
    marginLeft: 4,
  },
  clearAll: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderTop: theme.palette.border.faint,
    paddingTop: 14,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.secondary,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  clearAllIcon: {
    fontSize: 16,
  },
}));

/**
 * The /library filter sidebar (from the "Reading Room" handoff, artboard 5a),
 * floated in the empty left-nav gutter beside the all-sequences list: counted
 * topic facets, a curated checkbox, per-user read-status chips, and
 * clear-all. Purely presentational over the settings owned by
 * LibraryAllSequencesList, which also keeps its own in-column controls — the
 * two stay in sync through the shared state.
 */
const LibraryFilterSidebar = ({settings, onSettingsChange, onClearAll}: {
  settings: LibraryFilterSettings,
  onSettingsChange: (settings: LibraryFilterSettings, source: string) => void,
  onClearAll: () => void,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { topics, wikitags, curatedOnly, statuses } = settings;

  // Static per-topic totals (not narrowed by the other active filters)
  const { data: topicCountsData } = useQuery(LibraryTopicCountsSidebarQuery);
  const topicCounts = topicCountsData?.libraryTopicCounts;
  const { data: statusCountsData } = useQuery(LibraryStatusCountsQuery, {
    skip: !currentUser,
  });
  const statusCounts = statusCountsData?.libraryStatusCounts;
  const { data: totalCountData } = useQuery(LibrarySequencesTotalCountQuery);
  const totalCount = totalCountData?.sequences?.totalCount ?? undefined;

  const getTopicCount = (topic: string) =>
    topicCounts?.find(entry => entry.topic === topic)?.count;

  // Facet rows are single-select: clicking a row replaces the selection, and
  // clicking the selected row deselects it (equivalent to "All topics") —
  // the same semantics as the in-column chip row.
  const selectTopic = (topic: string) => {
    const newTopics = topics.includes(topic) ? [] : [topic];
    onSettingsChange({ ...settings, topics: newTopics }, 'sidebarFacet');
  };

  // Wikitags picked from the "+" picker accumulate as always-selected rows;
  // clicking a wikitag row removes it. Picking a wikitag that's already a
  // core topic selects that facet instead, so the list never shows two
  // same-named rows with different matching rules.
  const addWikitagFilter = ({tagId, tagName}: {tagId: string, tagName: string}) => {
    if (LIBRARY_CORE_TAG_NAMES.some(name => name === tagName)) {
      if (!topics.includes(tagName)) {
        onSettingsChange({ ...settings, topics: [...topics, tagName] }, 'sidebarWikitagPicker');
      }
      return;
    }
    if (!wikitags.some(tag => tag.tagId === tagId)) {
      onSettingsChange({ ...settings, wikitags: [...wikitags, {tagId, tagName}] }, 'sidebarWikitagPicker');
    }
  };

  const removeWikitagFilter = (tagId: string) => {
    onSettingsChange({ ...settings, wikitags: wikitags.filter(tag => tag.tagId !== tagId) }, 'sidebarFacet');
  };

  const toggleStatus = (status: LibraryStatusFilter) => {
    const newStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status];
    onSettingsChange({ ...settings, statuses: newStatuses }, 'statusChip');
  };

  const statusCountByValue: Record<LibraryStatusFilter, number | undefined> = {
    unread: statusCounts?.unread,
    inProgress: statusCounts?.inProgress,
    finished: statusCounts?.finished,
  };

  return <div className={classes.root}>
    <div>
      <div className={classes.sectionLabel}>Topic</div>
      <div className={classes.facetList}>
        <div
          className={classNames(classes.facetRow, topics.length === 0 && wikitags.length === 0 && classes.facetRowActive)}
          onClick={() => onSettingsChange({ ...settings, topics: [], wikitags: [] }, 'sidebarFacet')}
        >
          <span className={classes.facetName}>All topics</span>
          {totalCount !== undefined && <span className={classes.facetCount}>{totalCount}</span>}
        </div>
        {wikitags.map(tag => <div
          key={tag.tagId}
          className={classNames(classes.facetRow, classes.facetRowActive)}
          onClick={() => removeWikitagFilter(tag.tagId)}
        >
          <span className={classes.facetName}>{tag.tagName}</span>
        </div>)}
        {LIBRARY_CORE_TAG_NAMES.map(topic => {
          const count = getTopicCount(topic);
          return <div
            key={topic}
            className={classNames(classes.facetRow, topics.includes(topic) && classes.facetRowActive)}
            onClick={() => selectTopic(topic)}
          >
            <span className={classes.facetName}>{topic}</span>
            {count !== undefined && <span className={classes.facetCount}>{count}</span>}
          </div>;
        })}
      </div>
      <LWTooltip title="Add Wikitag Filter">
        <AddTagButton hasTooltip={false} onTagSelected={addWikitagFilter}>
          <span className={classes.addFilterRow}>+ Add topic filter</span>
        </AddTagButton>
      </LWTooltip>
    </div>
    <div>
      <span
        className={classes.checkboxRow}
        onClick={() => onSettingsChange({ ...settings, curatedOnly: !curatedOnly }, 'sidebarCurated')}
      >
        <span
          className={classNames(classes.checkbox, curatedOnly && classes.checkboxChecked)}
          role="checkbox"
          aria-checked={curatedOnly}
          aria-label="Curated"
        >
          {curatedOnly && <CheckIcon className={classes.checkIcon} />}
        </span>
        <span className={classes.checkboxLabel}>Curated</span>
      </span>
    </div>
    {currentUser && <div>
      <div className={classes.sectionLabel}>Your status</div>
      <div className={classes.chipRow}>
        {STATUS_FILTERS.map(({value, label}) => {
          const count = statusCountByValue[value];
          return <span
            key={value}
            className={classNames(classes.chip, statuses.includes(value) && classes.chipSelected)}
            onClick={() => toggleStatus(value)}
          >
            {label}
            {count !== undefined && <span className={classes.chipCount}>{count}</span>}
          </span>;
        })}
      </div>
    </div>}
    <div className={classes.clearAll} onClick={onClearAll}>
      <CloseIcon className={classes.clearAllIcon} />
      Clear all filters
    </div>
    <SequencesNewButton />
  </div>;
};

export default LibraryFilterSidebar;
