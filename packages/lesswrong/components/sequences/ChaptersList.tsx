import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import Loading from "../vulcan-core/Loading";
import ChaptersItem from "./ChaptersItem";

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
    return <Loading />
  }

  // If any chapter has a number already, suggest the next number after the highest number.
  // Otherwise, suggest the next number after the number of chapters.
  const nextNumber = Math.max(...results.map((chapter) => chapter.number ?? 0), results.length) + 1;
  nextSuggestedNumberRef.current = nextNumber;

  return <div className="chapters-list">
    {results.map((chapter) => <ChaptersItem
      key={chapter._id}
      chapter={chapter}
      canEdit={canEdit}
    />)}
  </div>
}

export default registerComponent('ChaptersList', ChaptersList);


