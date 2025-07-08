import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { usePaginatedResolver } from "../hooks/usePaginatedResolver";
import EAPostsItem from "../posts/EAPostsItem";
import FriendlyPopularComment from "../comments/FriendlyPopularComment";
import Loading from "../vulcan-core/Loading";

const styles = (theme: ThemeType) => ({
  noResults: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
  },
});

const KeywordResults = ({keyword, startDate, endDate, classes}: {
  keyword: string,
  startDate: Date,
  endDate: Date,
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loading } = usePaginatedResolver({
    fragmentName: "KeywordAlertDisplay",
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
      {
        name: "endDate",
        graphQLType: "Date!",
        value: endDate,
      },
    ],
  });
  return (
    <div>
      {results?.map(({_id, post, comment}) => (
        post
          ? <EAPostsItem key={_id} post={post} viewType="card" />
          : comment
            ? <FriendlyPopularComment comment={comment} />
            : null
      ))}
      {loading && <Loading />}
      {!loading && (results?.length ?? 0) === 0 &&
        <div className={classes.noResults}>
          No results found
        </div>
      }
    </div>
  );
}

export default registerComponent("KeywordResults", KeywordResults, {styles});
