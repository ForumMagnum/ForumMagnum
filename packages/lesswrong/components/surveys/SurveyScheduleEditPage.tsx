import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { Link } from "@/lib/reactRouterWrapper";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    paddingTop: 30,
  },
  surveyAdmin: {
    color: theme.palette.primary.main,
  },
});

const SurveyScheduleEditor = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {params: {id}} = useLocation();
  const navigate = useNavigate();
  const isNewForm = !id;

  const onCreate = useCallback(() => {
    navigate("/admin/surveys");
  }, [navigate]);

  const {SingleColumnSection, SectionTitle, WrappedSmartForm} = Components;
  return (
    <SingleColumnSection className={classes.root}>
      <Link to="/admin/surveys" className={classes.surveyAdmin}>
        &lt;- Back to survey admin
      </Link>
      <SectionTitle title={`${isNewForm ? "New" : "Edit"} survey schedule`} />
      <WrappedSmartForm
        collectionName="SurveySchedules"
        queryFragmentName="SurveyScheduleEdit"
        mutationFragmentName="SurveyScheduleEdit"
        documentId={id}
        successCallback={onCreate}
      />
    </SingleColumnSection>
  );
}

const SurveyScheduleEditPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  return currentUser?.isAdmin
    ? <SurveyScheduleEditor classes={classes} />
    : <Components.Error404 />;
}

const SurveyScheduleEditPageComponent = registerComponent(
  "SurveyScheduleEditPage",
  SurveyScheduleEditPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    SurveyScheduleEditPage: typeof SurveyScheduleEditPageComponent
  }
}
