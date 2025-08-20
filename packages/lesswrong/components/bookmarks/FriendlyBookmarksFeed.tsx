import React from "react";
import { registerComponent } from "@/lib/vulcan-lib/components";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { useCurrentUser } from "../common/withUser";
import { UltraFeedObserverProvider } from "../ultraFeed/UltraFeedObserver";
import { OverflowNavObserverProvider } from "../ultraFeed/OverflowNavObserverContext";
import { useMulti } from "../../lib/crud/withMulti";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import QuickTakesListItem from "../quickTakes/QuickTakesListItem";
import LoadMore from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
  loading: {
    marginTop: 32,
  },
  text: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
    fontWeight: 500,
  },
  loadMore: {
    marginTop: 8,
  },
});

const BookmarksFeed = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const currentUser = useCurrentUser();

  const { results: bookmarks = [], loading, error, loadMoreProps } = useMulti({
    collectionName: "Bookmarks",
    fragmentName: "BookmarksFriendlyFeedItemFragment",
    terms: {
      view: "myBookmarkedComments",
      userId: currentUser?._id,
      limit: 20,
    },
    fetchPolicy: "network-only",
    skip: !currentUser,
  });

  if (!currentUser || (loading && !bookmarks.length)) {
    return (
      <SingleColumnSection>
        <Loading className={classes.loading} />
      </SingleColumnSection>
    );
  }

  if (error) {
    return (
      <SingleColumnSection>
        <div className={classes.text}>Error loading saved comments</div>
      </SingleColumnSection>
    );
  }

  return (
    <AnalyticsContext pageSectionContext="bookmarksFeed">
      <UltraFeedObserverProvider incognitoMode={true} >
      <OverflowNavObserverProvider>
      <SingleColumnSection>
        <SectionTitle title="Saved comments & quick takes" />
        {bookmarks.map((bookmark) =>
          bookmark.collectionName === "Comments" && bookmark.comment
            ? (
              <QuickTakesListItem
                key={bookmark._id}
                quickTake={bookmark.comment}
              />
            )
            : null
        )}
        <LoadMore {...loadMoreProps} className={classes.loadMore} />
        {bookmarks.length === 0 && !loading && (
          <div className={classes.text}>
            No saved comments yet
          </div>
        )}
      </SingleColumnSection>
      </OverflowNavObserverProvider>
      </UltraFeedObserverProvider>
    </AnalyticsContext>
  );
};

export default registerComponent("BookmarksFeed", BookmarksFeed, {styles});
