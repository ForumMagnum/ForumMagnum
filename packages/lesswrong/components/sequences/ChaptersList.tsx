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

/**
 * A sequence's chapters in reading mode. With `fetchFresh`, it skips cached
 * (and server-rendered) chapters and loads them from the server; that's used
 * after the sequence has been edited on this page, since the editor changes
 * chapters in ways the cached list doesn't reflect.
 */
const ChaptersList = ({sequenceId, fetchFresh = false}: {
  sequenceId: string,
  fetchFresh?: boolean,
}) => {
  const { data, loading } = useQuery(ChaptersFragmentMultiQuery, {
    variables: {
      selector: { SequenceChapters: { sequenceId } },
      limit: 100,
      enableTotal: false,
    },
    fetchPolicy: fetchFresh ? "network-only" : undefined,
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
