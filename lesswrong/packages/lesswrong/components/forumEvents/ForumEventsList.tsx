import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useMulti } from "../../lib/crud/withMulti";
import { Link } from "../../lib/reactRouterWrapper";
import { SectionTitle } from "@/components/common/SectionTitle";
import { Loading } from "@/components/vulcan-core/Loading";

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
  const {results: events, loading} = useMulti({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsMinimumInfo",
    terms: {
      view,
    },
  });
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

const ForumEventsListComponent = registerComponent(
  "ForumEventsList",
  ForumEventsList,
  {styles},
);

declare global {
  interface ComponentTypes {
    ForumEventsList: typeof ForumEventsListComponent
  }
}

export default ForumEventsListComponent;
