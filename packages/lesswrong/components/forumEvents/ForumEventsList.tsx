import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import SectionTitle from "../common/SectionTitle";
import Loading from "../vulcan-core/Loading";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const ForumEventsMinimumInfoMultiQuery = gql(`
  query multiForumEventForumEventsListQuery($selector: ForumEventSelector, $limit: Int, $enableTotal: Boolean) {
    forumEvents(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ForumEventsMinimumInfo
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  event: {
    color: theme.palette.primary.dark,
    fontWeight: 500,
  },
  noEvents: {
    color: theme.palette.grey[600],
  },
});

export const ForumEventsList = ({title, view, classes}: {
  title: string,
  view: ForumEventsViewName,
  classes: ClassesType<typeof styles>,
}) => {
  const { data, loading } = useQuery(ForumEventsMinimumInfoMultiQuery, {
    variables: {
      selector: { [view]: {} },
      limit: 10,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
  });

  const events = data?.forumEvents?.results;
  return (
    <div className={classes.root}>
      <SectionTitle title={title} />
      {loading && <Loading />}
      {events?.map((event) =>
        <div key={event._id}>
          <Link to={`/editForumEvent/${event._id}`} className={classes.event}>
            {event.title}
          </Link>
        </div>
      )}
      {!loading && events?.length === 0 &&
        <div>No events found</div>
      }
    </div>
  );
}

export default registerComponent(
  "ForumEventsList",
  ForumEventsList,
  {styles},
);


