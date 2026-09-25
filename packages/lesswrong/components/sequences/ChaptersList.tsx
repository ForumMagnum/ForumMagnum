import React from 'react';
import Loading from "../vulcan-core/Loading";
import ChaptersItem from "./ChaptersItem";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

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

const ChaptersList = ({sequenceId}: {
  sequenceId: string,
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

  return <div className="chapters-list">
    {results.map((chapter) => <ChaptersItem
      key={chapter._id}
      chapter={chapter}
    />)}
  </div>
}

export default ChaptersList;
