import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import EAPostsItem from "../posts/EAPostsItem";
import Loading from "../vulcan-core/Loading";

const KeywordResults = ({keyword, startDate}: {
  keyword: string,
  startDate: Date,
}) => {
  const { results, loading } = usePaginatedResolver({
    fragmentName: "PostsListWithVotes",
    resolverName: "KeywordAlerts",
    limit: 100,
    itemsPerPage: 100,
    ssr: false,
    args: [
      {
        name: "keyword",
        graphQLType: "String!",
        value: keyword,
      },
      {
        name: "startDate",
        graphQLType: "Date!",
        value: startDate,
      },
    ],
  });
  return (
    <div>
      {results?.map((post) => (
        <EAPostsItem key={post._id} post={post} viewType="card" />
      ))}
      {loading && <Loading />}
    </div>
  );
}

export default registerComponent("KeywordResults", KeywordResults);
