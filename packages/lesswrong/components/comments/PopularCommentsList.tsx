import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useMulti } from "../../lib/crud/withMulti";
import { gql, useQuery } from "@apollo/client";
import { makeSortableListComponent } from "../form-components/sortableList";
import { getAlgoliaIndexName } from "../../lib/search/algoliaUtil";

const getTopUpvotedUsersQuery = gql`
  query TopUpvotedUsersQuery {
    TopUpvotedUsers {
      topUpvotedUsers {
        authorId
        displayName  
      }
    }
  }
`;

const SortableList = makeSortableListComponent({
  renderItem: ({contents, removeItem, classes}) => {
    return <li className={classes.item}>
      <Components.SingleUsersItem userId={contents} removeItem={removeItem} />
    </li>
  }
});

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.grey[1000],
  },
  list: {
    display: "flex",
    flexWrap: "wrap"
  },
  item: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  },
});

const PopularCommentsList = ({classes}: {classes: ClassesType}) => {
  const { data } = useQuery(getTopUpvotedUsersQuery, { ssr: true });

  const topUpvotedUserIds: string[] = data?.TopUpvotedUsers?.topUpvotedUsers?.map(({ authorId }: AnyBecauseTodo) => authorId) ?? [];

  const [userIds, setUserIds] = useState(topUpvotedUserIds);

  const {loading, loadMoreProps, results} = useMulti({
    terms: {view: "recentUsersComments", userIds},
    collectionName: "Comments",
    fragmentName: "CommentsListWithParentMetadata",
    enableTotal: false,
    skip: !userIds || userIds.length === 0,
    limit: 10,
  });

  // const {loading, loadMoreProps, results} = useMulti({
  //   terms: {view: "frontpagePopular"},
  //   collectionName: "Comments",
  //   fragmentName: "CommentsListWithParentMetadata",
  //   enableTotal: false,
  //   limit: 3,
  // });

  const {Loading, LoadMore, PopularComment, SearchAutoComplete} = Components;
  if (loading && (!results || results.length === 0)) {
    return (
      <Loading />
    );
  } 

  return (
    <div className={classes.root}>
      <SearchAutoComplete
        indexName={getAlgoliaIndexName("Users")}
        clickAction={(userId) => setUserIds([...userIds, userId])}
        renderSuggestion={(hit: any) => <Components.UsersAutoCompleteHit document={hit} />}
        renderInputComponent={(hit: any) => <Components.UsersSearchInput inputProps={hit} />}
        placeholder={"Search for Users"}
        noSearchPlaceholder='User ID'
      />
      <SortableList
        axis="xy"
        value={userIds}
        setValue={setUserIds}
        className={classes.list}
        classes={classes}
      />
      {results?.map((comment) =>
        <PopularComment
          key={comment._id}
          comment={comment}
        />
      )}
      <LoadMore {...loadMoreProps} />
    </div>
  );
}

const PopularCommentsListComponent = registerComponent(
  "PopularCommentsList",
  PopularCommentsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    PopularCommentsList: typeof PopularCommentsListComponent
  }
}
