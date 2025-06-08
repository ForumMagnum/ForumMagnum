import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import Loading from "../vulcan-core/Loading";
import ChaptersItem from "./ChaptersItem";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const ChaptersFragmentMultiQuery = gql(`
  query multiChapterChaptersListQuery($selector: ChapterSelector, $limit: Int, $enableTotal: Boolean) {
    chapters(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ChaptersFragment
      }
      totalCount
    }
  }
`);

const ChaptersList = ({sequenceId, canEdit, nextSuggestedNumberRef}: {
  sequenceId: string,
  canEdit: boolean,
  nextSuggestedNumberRef: React.MutableRefObject<number>,
}) => {
  const { data, loading } = useQuery(ChaptersFragmentMultiQuery, {
    variables: {
      selector: { SequenceChapters: { sequenceId } },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.chapters?.results;

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


