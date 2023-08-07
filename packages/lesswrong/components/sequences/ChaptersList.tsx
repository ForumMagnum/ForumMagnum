import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const ChaptersList = ({sequenceId, canEdit, nextSuggestedNumberRef}: {
  sequenceId: string,
  canEdit: boolean,
  nextSuggestedNumberRef: React.MutableRefObject<number>,
}) => {
  const { results, loading } = useMulti({
    terms: {
      view: "SequenceChapters",
      sequenceId,
      limit: 100
    },
    collectionName: "Chapters",
    fragmentName: 'ChaptersFragment',
    enableTotal: false,
  });

  if (!results || loading) {
    return <Components.Loading />
  }

  // If any chapter has a number already, suggest the next number after the highest number.
  // Otherwise, suggest the next number after the number of chapters.
  const nextNumber = Math.max(...results.map((chapter) => chapter.number ?? 0), results.length) + 1;
  nextSuggestedNumberRef.current = nextNumber;

  return <div className="chapters-list">
    {results.map((chapter) => <Components.ChaptersItem
      key={chapter._id}
      chapter={chapter}
      canEdit={canEdit}
    />)}
  </div>
}

const ChaptersListComponent = registerComponent('ChaptersList', ChaptersList)

declare global {
  interface ComponentTypes {
    ChaptersList: typeof ChaptersListComponent
  }
}
