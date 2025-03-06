import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { Link } from "@/lib/reactRouterWrapper";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";
import Error404 from "@/components/common/Error404";

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
    : <Error404 />;
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

export default SurveyScheduleEditPageComponent;
