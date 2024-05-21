import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation } from "../../lib/routeUtil";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

export const EditForumEventPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {params: {documentId}} = useLocation();

  const {SingleColumnSection, ForumEventForm, PermanentRedirect} = Components;
  if (documentId?.length !== 17) {
    return <PermanentRedirect status={307} url="/adminForumEvents" />
  }

  return (
    <SingleColumnSection className={classes.root}>
      <div>
        <Link to="/adminForumEvents">&lt;- Manage forum events</Link>
      </div>
      <ForumEventForm documentId={documentId} />
    </SingleColumnSection>
  );
}

const EditForumEventPageComponent = registerComponent(
  "EditForumEventPage",
  EditForumEventPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EditForumEventPage: typeof EditForumEventPageComponent
  }
}
