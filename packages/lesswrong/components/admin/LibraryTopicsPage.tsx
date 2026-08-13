"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { LIBRARY_TOPICS } from '@/lib/collections/sequences/libraryTopics';
import { sequenceGetPageUrl } from '../../lib/collections/sequences/helpers';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from '../common/SingleColumnSection';
import SectionTitle from '../common/SectionTitle';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import Loading from '../vulcan-core/Loading';
import { Link } from '../../lib/reactRouterWrapper';
import StarIcon from '@/lib/vendor/@material-ui/icons/src/Star';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const LibraryTopicsAdminSequencesQuery = gql(`
  query LibraryTopicsAdminSequences($limit: Int) {
    sequences(selector: { librarySequences: {} }, limit: $limit) {
      results {
        _id
        title
        curatedOrder
        libraryTopic
        user {
          _id
          displayName
        }
      }
    }
  }
`);

const LibraryTopicsAdminUpdateMutation = gql(`
  mutation LibraryTopicsAdminUpdateSequence($selector: SelectorInput!, $data: UpdateSequenceDataInput!) {
    updateSequence(selector: $selector, data: $data) {
      data {
        _id
        libraryTopic
      }
    }
  }
`);

type TopicFilter = 'all' | 'untagged' | typeof LIBRARY_TOPICS[number];

type RowSaveState = 'saving' | 'saved' | 'error';

const styles = defineStyles('LibraryTopicsPage', (theme: ThemeType) => ({
  progress: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    marginBottom: 12,
  },
  controls: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13.5,
    padding: '6px 10px',
    border: theme.palette.border.normal,
    borderRadius: 3,
    background: theme.palette.panelBackground.default,
    color: theme.palette.text.normal,
    outline: 'none',
  },
  select: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13.5,
  },
  table: {
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 5px ${theme.palette.boxShadowColor(0.025)}`,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 160px 180px 50px',
    gap: '12px',
    alignItems: 'center',
    padding: '7px 12px',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  titleCell: {
    minWidth: 0,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  titleLink: {
    color: theme.palette.text.normal,
    '&:hover': {
      color: theme.palette.primary.main,
    },
  },
  star: {
    fontSize: 13,
    color: theme.palette.text.dim,
    marginLeft: 4,
    verticalAlign: -1,
  },
  author: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  saveState: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.dim,
  },
  saveError: {
    color: theme.palette.error.main,
  },
}));

/**
 * Admin/mod tool for bulk-assigning libraryTopic to sequences (the /library
 * redesign's topic pills and tag filter). Lists every sequence the redesigned
 * library page shows, with a per-row topic dropdown that saves immediately.
 */
const LibraryTopicsPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [searchText, setSearchText] = useState('');
  const [topicFilter, setTopicFilter] = useState<TopicFilter>('untagged');
  const [saveStates, setSaveStates] = useState<Record<string, RowSaveState>>({});

  const { data, loading } = useQuery(LibraryTopicsAdminSequencesQuery, {
    variables: { limit: 2000 },
    skip: !userIsAdminOrMod(currentUser),
  });
  const [updateSequence] = useMutation(LibraryTopicsAdminUpdateMutation);

  if (!userIsAdminOrMod(currentUser)) {
    return <SingleColumnSection>
      <ErrorAccessDenied />
    </SingleColumnSection>;
  }

  const sequences = data?.sequences?.results ?? [];
  const taggedCount = sequences.filter(sequence => sequence.libraryTopic).length;

  const searchLower = searchText.trim().toLowerCase();
  const visibleSequences = sequences.filter(sequence => {
    if (topicFilter === 'untagged' && sequence.libraryTopic) return false;
    if (topicFilter !== 'all' && topicFilter !== 'untagged' && sequence.libraryTopic !== topicFilter) return false;
    if (searchLower) {
      const haystack = `${sequence.title ?? ''} ${sequence.user?.displayName ?? ''}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    return true;
  });

  const handleTopicChange = async (sequenceId: string, value: string) => {
    setSaveStates(prev => ({ ...prev, [sequenceId]: 'saving' }));
    try {
      await updateSequence({
        variables: {
          selector: { _id: sequenceId },
          data: { libraryTopic: value || null },
        },
      });
      setSaveStates(prev => ({ ...prev, [sequenceId]: 'saved' }));
    } catch (error) {
      setSaveStates(prev => ({ ...prev, [sequenceId]: 'error' }));
    }
  };

  return <SingleColumnSection>
    <SectionTitle title="Library Topic Tagging" />
    <div className={classes.progress}>
      {loading ? 'Loading…' : `${taggedCount} / ${sequences.length} sequences tagged · showing ${visibleSequences.length}`}
    </div>
    <div className={classes.controls}>
      <input
        type="text"
        className={classes.searchInput}
        placeholder="Filter by title or author…"
        value={searchText}
        onChange={event => setSearchText(event.target.value)}
      />
      <select
        className={classes.select}
        value={topicFilter}
        onChange={event => setTopicFilter(event.target.value as TopicFilter)}
      >
        <option value="untagged">Untagged</option>
        <option value="all">All</option>
        {LIBRARY_TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
      </select>
    </div>
    {loading && <Loading />}
    <div className={classes.table}>
      {visibleSequences.map(sequence => {
        const saveState = saveStates[sequence._id];
        return <div key={sequence._id} className={classes.row}>
          <span className={classes.titleCell}>
            <Link
              to={sequenceGetPageUrl(sequence)}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.titleLink}
            >
              {sequence.title}
            </Link>
            {sequence.curatedOrder != null && <StarIcon className={classes.star} />}
          </span>
          <span className={classes.author}>{sequence.user?.displayName}</span>
          <select
            className={classes.select}
            value={sequence.libraryTopic ?? ''}
            onChange={event => handleTopicChange(sequence._id, event.target.value)}
          >
            <option value="">—</option>
            {LIBRARY_TOPICS.map(topic => <option key={topic} value={topic}>{topic}</option>)}
          </select>
          <span className={classes.saveState}>
            {saveState === 'saving' && '…'}
            {saveState === 'saved' && '✓'}
            {saveState === 'error' && <span className={classes.saveError}>failed</span>}
          </span>
        </div>;
      })}
    </div>
  </SingleColumnSection>;
};

export default LibraryTopicsPage;
