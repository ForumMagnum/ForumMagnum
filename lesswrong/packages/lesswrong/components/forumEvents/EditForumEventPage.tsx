import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { Link } from "../../lib/reactRouterWrapper";
import { useLocation } from "../../lib/routeUtil";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import ForumEventForm from "@/components/forumEvents/ForumEventForm";
import PermanentRedirect from "@/components/common/PermanentRedirect";

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

export default EditForumEventPageComponent;
