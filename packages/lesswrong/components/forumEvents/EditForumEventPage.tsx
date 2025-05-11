import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation } from "../../lib/routeUtil";
import SingleColumnSection from "../common/SingleColumnSection";
import ForumEventForm from "./ForumEventForm";
import PermanentRedirect from "../common/PermanentRedirect";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

export const EditForumEventPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {params: {documentId}} = useLocation();
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

export default registerComponent(
  "EditForumEventPage",
  EditForumEventPage,
  {styles},
);


